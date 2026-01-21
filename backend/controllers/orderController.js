const db = require("../config/db.js");

// Helper function
const checkVariantStock = async (variantId, quantity, conn) => {
  const [variantIngredients] = await conn.execute(
    `SELECT pi.ingredient_id, pi.amount, inv.quantity as available, i.ingredient_name
     FROM tbl_product_ingredients pi
     LEFT JOIN tbl_inventory inv ON inv.ingredient_id = pi.ingredient_id
     LEFT JOIN tbl_ingredients i ON i.id = pi.ingredient_id
     WHERE pi.variant_id = ?`,
    [variantId]
  );

  for (const ing of variantIngredients) {
    const requiredAmount = ing.amount * quantity;
    const available = ing.available || 0;

    if (available < requiredAmount) {
      return {
        inStock: false,
        message: `Insufficient ${ing.ingredient_name}. Need: ${requiredAmount}, Available: ${available}`
      };
    }
  }

  return { inStock: true };
};

// CREATE ORDER with ingredient & add-on deduction
const createOrder = async (req, res) => {
  const { cashier_id, order_type, status, total, items, discount_type, discount, paid, change } = req.body;

  console.log("📥 INCOMING ORDER DATA:", {
    cashier_id,
    order_type,
    status,
    total,
    discount_type,
    discount,
    items: items.map(i => ({
      variant_id: i.variant_id,
      quantity: i.quantity,
      discount_type: i.discount_type,  // ✅ Per-item discount
      discount: i.discount             // ✅ Per-item discount amount
    }))
  });

  if (!cashier_id || total === undefined || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields: cashier_id, total, items" });
  }

  let conn;
  try { 
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Insert order header
    const [orderResult] = await conn.execute(
      `INSERT INTO tbl_orders (
        cashier_id, 
        order_type, 
        status, 
        total, 
        discount_type, 
        discount, 
        paid, 
        \`change\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cashier_id,
        order_type || "dine-in",
        status || "completed",
        Number(total),
        discount_type || null,
        discount ? Number(discount) : 0,
        paid ? Number(paid) : Number(total),
        change ? Number(change) : 0
      ]
    );

    const order_id = orderResult.insertId;
    console.log("✅ Order created with ID:", order_id);

    // 2️⃣ Process each item
    for (const item of items) {
      const { variant_id, quantity, price, discount_type: itemDiscountType, discount: itemDiscount, addOns = [] } = item;

      if (!variant_id || quantity === undefined || price === undefined) {
        await conn.rollback();
        return res.status(400).json({ 
          message: "Each item must include variant_id, quantity, and price" 
        });
      }

      // Get ingredients for this variant
      const [variantIngredients] = await conn.execute(
        `SELECT pi.ingredient_id, pi.amount, inv.quantity as available, i.ingredient_name
         FROM tbl_product_ingredients pi
         LEFT JOIN tbl_inventory inv ON inv.ingredient_id = pi.ingredient_id
         LEFT JOIN tbl_ingredients i ON i.id = pi.ingredient_id
         WHERE pi.variant_id = ?`,
        [variant_id]
      );

      // Check stock for ingredients
      for (const ing of variantIngredients) {
        const requiredAmount = ing.amount * quantity;
        const available = ing.available || 0;

        if (available < requiredAmount) {
          await conn.rollback();
          return res.status(400).json({
            message: `Insufficient ${ing.ingredient_name}. Need ${requiredAmount}, only ${available} available`
          });
        }
      }

      // Check stock for add-ons
      for (const addOn of addOns) {
        const [toppingData] = await conn.execute(
          `SELECT id, name, quantity FROM tbl_toppings WHERE id = ? AND is_deleted = 0`,
          [addOn.id]
        );

        if (!toppingData.length) {
          await conn.rollback();
          return res.status(400).json({
            message: `Add-on (ID: ${addOn.id}) not found`
          });
        }

        const topping = toppingData[0];
        const requiredQuantity = (addOn.quantity || 1) * quantity;  // ✅ Per item quantity
        const available = Number(topping.quantity) || 0;

        if (available < requiredQuantity) {
          await conn.rollback();
          return res.status(400).json({
            message: `Insufficient ${topping.name}. Need ${requiredQuantity}, only ${available} available`
          });
        }
      }

      // ✅ Insert order detail WITH per-item discount
      const subtotal = Number(price) * Number(quantity);
      const itemDiscountAmount = itemDiscount ? Number(itemDiscount) : 0;
      
      await conn.execute(
        `INSERT INTO tbl_orders_details (
          order_id, 
          variant_id, 
          quantity, 
          subtotal,
          discount_type,
          discount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, variant_id, Number(quantity), subtotal, itemDiscountType || null, itemDiscountAmount]
      );

      // Deduct ingredients from inventory
      for (const ing of variantIngredients) {
        const amountToDeduct = ing.amount * quantity;
        await conn.execute(
          "UPDATE tbl_inventory SET quantity = quantity - ? WHERE ingredient_id = ?",
          [amountToDeduct, ing.ingredient_id]
        );
      }

      // Deduct add-ons from tbl_toppings
      for (const addOn of addOns) {
        const requiredQuantity = (addOn.quantity || 1) * quantity;  // ✅ Per item quantity
        await conn.execute(
          "UPDATE tbl_toppings SET quantity = quantity - ? WHERE id = ?",
          [requiredQuantity, addOn.id]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: "Order created successfully", order_id });
  } catch (error) {
    console.error("❌ Create order error:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: "Cannot create order", error: error.message });
  } finally {
    if (conn) conn.release();
  }
};

// ✅ UPDATE getOrders to retrieve per-item discounts
const getOrders = async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT 
         id, 
         cashier_id, 
         order_type, 
         status, 
         total, 
         discount_type, 
         discount,
         paid, 
         \`change\`, 
         created_at
       FROM tbl_orders 
       ORDER BY created_at DESC`
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.execute(
          `SELECT 
            d.id,
            d.variant_id, 
            d.quantity, 
            d.subtotal,
            d.discount_type,
            d.discount,
            p.product_name, 
            v.name AS variant_name,
            v.calculated_cost,
            v.price
           FROM tbl_orders_details d
           JOIN tbl_product_variants v ON d.variant_id = v.id
           JOIN tbl_products p ON v.product_id = p.id
           WHERE d.order_id = ?`,
          [order.id]
        );
        return { ...order, items };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Cannot get orders", error: error.message });
  }
};

// ✅ UPDATE updateOrder to handle per-item discounts
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { items, total, discount_type, discount, paid, change } = req.body;

  if (!id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields: order id and items" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Get old items to RESTORE ingredients and add-ons
    const [oldItems] = await conn.execute(
      `SELECT od.id, od.variant_id, od.quantity, pi.ingredient_id, pi.amount
       FROM tbl_orders_details od
       LEFT JOIN tbl_product_ingredients pi ON od.variant_id = pi.variant_id
       WHERE od.order_id = ?`,
      [id]
    );

    // Restore old ingredients back to inventory
    for (const oldItem of oldItems) {
      if (oldItem.ingredient_id) {
        const amountToRestore = oldItem.amount * oldItem.quantity;
        await conn.execute(
          "UPDATE tbl_inventory SET quantity = quantity + ? WHERE ingredient_id = ?",
          [amountToRestore, oldItem.ingredient_id]
        );
      }
    }

    // Update order header
    await conn.execute(
      "UPDATE tbl_orders SET total = ?, discount_type = ?, discount = ?, paid = ?, `change` = ? WHERE id = ?",
      [
        Number(total),
        discount_type || null,
        discount ? Number(discount) : 0,
        paid ? Number(paid) : (Number(total) || 0),
        change ? Number(change) : 0,
        id
      ]
    );

    // Delete old order details
    await conn.execute("DELETE FROM tbl_orders_details WHERE order_id = ?", [id]);

    // Insert new order details with per-item discounts
    for (const item of items) {
      const { variant_id, quantity, price, discount_type: itemDiscountType, discount: itemDiscount, addOns = [] } = item;

      if (!variant_id || quantity === undefined || price === undefined) {
        await conn.rollback();
        return res.status(400).json({ 
          message: "Each item must include variant_id, quantity, and price" 
        });
      }

      // Get NEW ingredients for this variant
      const [newVariantIngredients] = await conn.execute(
        `SELECT pi.ingredient_id, pi.amount, inv.quantity as available, i.ingredient_name
         FROM tbl_product_ingredients pi
         LEFT JOIN tbl_inventory inv ON inv.ingredient_id = pi.ingredient_id
         LEFT JOIN tbl_ingredients i ON i.id = pi.ingredient_id
         WHERE pi.variant_id = ?`,
        [variant_id]
      );

      // Check ingredient availability
      for (const ing of newVariantIngredients) {
        const requiredAmount = ing.amount * quantity;
        const available = ing.available || 0;

        if (available < requiredAmount) {
          await conn.rollback();
          return res.status(400).json({
            message: `Not enough ${ing.ingredient_name}. Need ${requiredAmount}, only ${available} available`
          });
        }
      }

      // Check add-on availability
      for (const addOn of addOns) {
        const [toppingData] = await conn.execute(
          `SELECT id, name, quantity FROM tbl_toppings WHERE id = ? AND is_deleted = 0`,
          [addOn.id]
        );

        if (!toppingData.length) {
          await conn.rollback();
          return res.status(400).json({
            message: `Add-on (ID: ${addOn.id}) not found`
          });
        }

        const topping = toppingData[0];
        const requiredQuantity = (addOn.quantity || 1) * quantity;
        const available = Number(topping.quantity) || 0;

        if (available < requiredQuantity) {
          await conn.rollback();
          return res.status(400).json({
            message: `Not enough ${topping.name}. Need ${requiredQuantity}, only ${available} available`
          });
        }
      }

      const subtotal = Number(price) * Number(quantity);
      const itemDiscountAmount = itemDiscount ? Number(itemDiscount) : 0;

      // ✅ Insert new order detail WITH per-item discount
      await conn.execute(
        `INSERT INTO tbl_orders_details (
          order_id, 
          variant_id, 
          quantity, 
          subtotal,
          discount_type,
          discount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, variant_id, Number(quantity), subtotal, itemDiscountType || null, itemDiscountAmount]
      );

      // DEDUCT new ingredients from inventory
      for (const ing of newVariantIngredients) {
        const amountToDeduct = ing.amount * quantity;
        await conn.execute(
          "UPDATE tbl_inventory SET quantity = quantity - ? WHERE ingredient_id = ?",
          [amountToDeduct, ing.ingredient_id]
        );
      }

      // DEDUCT new add-ons from tbl_toppings
      for (const addOn of addOns) {
        const requiredQuantity = (addOn.quantity || 1) * quantity;
        await conn.execute(
          "UPDATE tbl_toppings SET quantity = quantity - ? WHERE id = ?",
          [requiredQuantity, addOn.id]
        );
      }
    }

    await conn.commit();
    res.json({ message: "Order updated successfully", order_id: id });
  } catch (error) {
    console.error("Update order error:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: "Cannot update order", error: error.message });
  } finally {
    if (conn) conn.release();
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ message: "Order ID and status required" });
  }

  try {
    await db.execute(
      "UPDATE tbl_orders SET status = ? WHERE id = ?",
      [status, id]
    );
    res.json({ message: "Order status updated successfully", status });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrder,
  updateOrderStatus,
};