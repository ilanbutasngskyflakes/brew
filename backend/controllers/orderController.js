// // const db = require("../config/db.js");

// // // CREATE ORDER
// // const createOrder = async (req, res) => {
// //   const { cashier_id, order_type, status, total, items } = req.body;

// //   if (!cashier_id || total === undefined || !Array.isArray(items) || items.length === 0) {
// //     return res.status(400).json({ message: "Missing required fields: cashier_id, total, items" });
// //   }

// //   let conn;
// //   try {
// //     conn = await db.getConnection();
// //     await conn.beginTransaction();

// //     const [orderResult] = await conn.execute(
// //       "INSERT INTO tbl_orders (cashier_id, order_type, status, total) VALUES (?, ?, ?, ?)",
// //       [cashier_id, order_type || null, status || "pending", Number(total)]
// //     );

// //     const order_id = orderResult.insertId;

// //     for (const item of items) {
// //       const { product_id, quantity, subtotal } = item;

// //       if (!product_id || quantity === undefined) {
// //         await conn.rollback();
// //         return res.status(400).json({ message: "Each item must include product_id and quantity" });
// //       }

// //       await conn.execute(
// //         "INSERT INTO tbl_orders_details (product_id, order_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
// //         [product_id, order_id, Number(quantity), subtotal === undefined ? null : Number(subtotal)]
// //       );
// //     }

// //     await conn.commit();
// //     res.status(201).json({ message: "Order created", order_id });
// //   } catch (error) {
// //     console.error("Create order error:", error);
// //     if (conn) await conn.rollback();
// //     res.status(500).json({ message: "Cannot create order" });
// //   } finally {
// //     if (conn) conn.release();
// //   }
// // };


// // const getOrders = async (req, res) => {
// //   try {
// //     const [orders] = await db.execute("SELECT * FROM tbl_orders ORDER BY created_at DESC");

// //     const ordersWithItems = await Promise.all(
// //       orders.map(async (order) => {
// //         const [items] = await db.execute(
// //           `SELECT d.*, p.product_name, d.quantity, d.subtotal, d.product_id
// //            FROM tbl_orders_details d
// //            JOIN tbl_products p ON d.product_id = p.id
// //            WHERE d.order_id = ?`,
// //           [order.id]
// //         );
// //         return { ...order, items };
// //       })
// //     );

// //     res.json(ordersWithItems);
// //   } catch (error) {
// //     console.error("Get orders error:", error);
// //     res.status(500).json({ message: "Cannot get orders" });
// //   }
// // };

// // // UPDATE ORDER STATUS
// // const updateOrderStatus = async (req, res) => {
// //   const { id } = req.params;
// //   const { status } = req.body;

// //   if (!status) return res.status(400).json({ message: "Status required" });

// //   try {
// //     await db.execute("UPDATE tbl_orders SET status = ? WHERE id = ?", [status, id]);
// //     res.json({ message: "Order updated" });
// //   } catch (error) {
// //     console.error("Update order error:", error);
// //     res.status(500).json({ message: "Failed to update order" });
// //   }
// // };

// // module.exports = {
// //   createOrder,
// //   getOrders,
// //   updateOrderStatus,
// // };
// // backend/controllers/orderController.js
// const db = require("../config/db.js");

// // CREATE ORDER
// const createOrder = async (req, res) => {
//   const { cashier_id, order_type, status, total, items } = req.body;

//   if (!cashier_id || total === undefined || !Array.isArray(items) || items.length === 0) {
//     return res.status(400).json({ message: "Missing required fields: cashier_id, total, items" });
//   }

//   let conn;
//   try {
//     conn = await db.getConnection();
//     await conn.beginTransaction();

//     // 1️⃣ Insert order
//     const [orderResult] = await conn.execute(
//       "INSERT INTO tbl_orders (cashier_id, order_type, status, total) VALUES (?, ?, ?, ?)",
//       [cashier_id, order_type || null, status || "pending", Number(total)]
//     );

//     const order_id = orderResult.insertId;

//     // 2️⃣ Process each item
//     for (const item of items) {
//       const { product_id, variant_id, quantity, subtotal } = item;

//       if (!product_id || !variant_id || quantity === undefined) {
//         await conn.rollback();
//         return res.status(400).json({ message: "Each item must include product_id, variant_id, and quantity" });
//       }

//       // Check variant stock
//       const [variantRows] = await conn.execute(
//         "SELECT quantity FROM tbl_product_variants WHERE id = ? AND product_id = ?",
//         [variant_id, product_id]
//       );

//       if (variantRows.length === 0) {
//         await conn.rollback();
//         return res.status(400).json({ message: `Variant not found for product ${product_id}` });
//       }

//       const currentStock = variantRows[0].quantity;

//       if (currentStock < quantity) {
//         await conn.rollback();
//         return res.status(400).json({
//           message: `Not enough stock for product_id ${product_id}, variant_id ${variant_id}`
//         });
//       }

//       // Insert order item
//       await conn.execute(
//         "INSERT INTO tbl_orders_details (order_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
//         [order_id, product_id, Number(quantity), subtotal === undefined ? null : Number(subtotal)]
//       );

//       // Deduct stock
//       await conn.execute(
//         "UPDATE tbl_product_variants SET quantity = quantity - ? WHERE id = ?",
//         [Number(quantity), variant_id]
//       );
//     }

//     await conn.commit();
//     res.status(201).json({ message: "Order created", order_id });
//   } catch (error) {
//     console.error("Create order error:", error);
//     if (conn) await conn.rollback();
//     res.status(500).json({ message: "Cannot create order", error });
//   } finally {
//     if (conn) conn.release();
//   }
// };

// // GET ORDERS
// // const getOrders = (req, res) => {
// //   // First, get all orders
// //   const ordersQuery = "SELECT * FROM tbl_orders ORDER BY id DESC";
  
// //   db.query(ordersQuery, (err, orders) => {
// //     if (err) {
// //       console.error("Failed to fetch orders:", err);
// //       return res.status(500).json({ message: "Failed to fetch orders" });
// //     }

// //     if (orders.length === 0) return res.json([]);

// //     // For each order, fetch its items
// //     const orderIds = orders.map(o => o.id);
    
// //     const itemsQuery = `
// //       SELECT d.*, p.product_name, v.name AS variant_name
// //       FROM tbl_orders_details d
// //       JOIN tbl_products p ON d.product_id = p.id
// //       LEFT JOIN tbl_product_variants v ON d.variant_id = v.id
// //       WHERE d.order_id IN (?)
// //     `;

// //     db.query(itemsQuery, [orderIds], (err, items) => {
// //       if (err) {
// //         console.error("Failed to fetch order items:", err);
// //         return res.status(500).json({ message: "Failed to fetch order items" });
// //       }

// //       // Attach items to their orders
// //       const ordersWithItems = orders.map(order => ({
// //         ...order,
// //         items: items.filter(item => item.order_id === order.id)
// //       }));

// //       res.json(ordersWithItems);
// //     });
// //   });
// // };

// const getOrders = async (req, res) => {
//   try {
//     const [orders] = await db.execute("SELECT * FROM tbl_orders ORDER BY created_at DESC");

//     const ordersWithItems = await Promise.all(
//       orders.map(async (order) => {
//         const [items] = await db.execute(
//   `SELECT d.*, p.product_name, v.name AS variant_name, d.quantity, d.subtotal, d.product_id
//    FROM tbl_orders_details d
//    JOIN tbl_products p ON d.product_id = p.id
//    LEFT JOIN tbl_product_variants v ON d.variant_id = v.id
//    WHERE d.order_id = ?`,
//   [order.id]
// );
//         return { ...order, items };
//       })
//     );

//     res.json(ordersWithItems);
//   } catch (error) {
//     console.error("Get orders error:", error);
//     res.status(500).json({ message: "Cannot get orders" });
//   }
// };

// // UPDATE ORDER STATUS
// const updateOrderStatus = async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   if (!status) return res.status(400).json({ message: "Status required" });

//   try {
//     await db.execute("UPDATE tbl_orders SET status = ? WHERE id = ?", [status, id]);
//     res.json({ message: "Order updated" });
//   } catch (error) {
//     console.error("Update order error:", error);
//     res.status(500).json({ message: "Failed to update order", error });
//   }
// };

// module.exports = {
//   createOrder,
//   getOrders,
//   updateOrderStatus,
// };
const db = require("../config/db.js");

// CREATE ORDER with ingredient deduction
const createOrder = async (req, res) => {
  const { cashier_id, order_type, status, total, items } = req.body;

  if (!cashier_id || total === undefined || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields: cashier_id, total, items" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1️⃣ Insert order
    const [orderResult] = await conn.execute(
      "INSERT INTO tbl_orders (cashier_id, order_type, status, total) VALUES (?, ?, ?, ?)",
      [cashier_id, order_type || "dine-in", status || "completed", Number(total)]
    );

    const order_id = orderResult.insertId;

    // 2️⃣ Process each item
    for (const item of items) {
      const { product_id, variant_id, quantity, subtotal } = item;

      if (!product_id || !variant_id || quantity === undefined) {
        await conn.rollback();
        return res.status(400).json({ 
          message: "Each item must include product_id, variant_id, and quantity" 
        });
      }

      // Get ingredients required for this variant
      const [variantIngredients] = await conn.execute(
        `SELECT 
          pi.ingredient_id, 
          pi.amount, 
          inv.quantity as available,
          i.ingredient_name
         FROM tbl_product_ingredients pi
         LEFT JOIN tbl_inventory inv ON inv.ingredient_id = pi.ingredient_id
         LEFT JOIN tbl_ingredients i ON i.id = pi.ingredient_id
         WHERE pi.variant_id = ?`,
        [variant_id]
      );

      // Check if enough ingredients are available
      for (const ing of variantIngredients) {
        const requiredAmount = ing.amount * quantity;
        const available = ing.available || 0;

        if (available < requiredAmount) {
          await conn.rollback();
          return res.status(400).json({
            message: `Not enough ${ing.ingredient_name}. Need ${requiredAmount}, only ${available} available`
          });
        }
      }

      // Insert order item (note: your schema doesn't have product_id in tbl_orders_details)
      await conn.execute(
        "INSERT INTO tbl_orders_details (order_id, variant_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
        [order_id, variant_id, Number(quantity), subtotal === undefined ? null : Number(subtotal)]
      );

      // Deduct ingredients from inventory
      for (const ing of variantIngredients) {
        const amountToDeduct = ing.amount * quantity;
        
        await conn.execute(
          "UPDATE tbl_inventory SET quantity = quantity - ? WHERE ingredient_id = ?",
          [amountToDeduct, ing.ingredient_id]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: "Order created successfully", order_id });
  } catch (error) {
    console.error("Create order error:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: "Cannot create order", error: error.message });
  } finally {
    if (conn) conn.release();
  }
};

// GET ORDERS
const getOrders = async (req, res) => {
  try {
    const [orders] = await db.execute("SELECT * FROM tbl_orders ORDER BY created_at DESC");

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.execute(
          `SELECT 
            d.*, 
            p.product_name, 
            v.name AS variant_name, 
            d.quantity, 
            d.subtotal
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

// UPDATE ORDER
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

    // Get old items to restore stock
    const [oldItems] = await conn.execute(
      "SELECT variant_id, quantity FROM tbl_orders_details WHERE order_id = ?",
      [id]
    );

    // Restore old stock
    for (const oldItem of oldItems) {
      await conn.execute(
        "UPDATE tbl_product_variants SET quantity = quantity + ? WHERE id = ?",
        [oldItem.quantity, oldItem.variant_id]
      );
    }

    // Update order
    await conn.execute(
      "UPDATE tbl_orders SET total = ?, discount_type = ?, discount = ?, paid = ?, `change` = ? WHERE id = ?",
      [
        Number(total),
        discount_type || null,
        discount ? Number(discount) : 0,
        paid ? Number(paid) : Number(total),
        change ? Number(change) : 0,
        id
      ]
    );

    // Delete old order details
    await conn.execute("DELETE FROM tbl_orders_details WHERE order_id = ?", [id]);

    // Insert new order details and deduct stock
    for (const item of items) {
      const { product_id, variant_id, topping_id, quantity, price } = item;

      if (!product_id || !variant_id || quantity === undefined || price === undefined) {
        await conn.rollback();
        return res.status(400).json({ 
          message: "Each item must include product_id, variant_id, quantity, and price" 
        });
      }

      const subtotal = Number(price) * Number(quantity);

      await conn.execute(
        "INSERT INTO tbl_orders_details (order_id, variant_id, quantity, topping_id, subtotal) VALUES (?, ?, ?, ?, ?)",
        [id, variant_id, Number(quantity), topping_id || null, subtotal]
      );

      // Deduct new stock
      await conn.execute(
        "UPDATE tbl_product_variants SET quantity = quantity - ? WHERE id = ?",
        [Number(quantity), variant_id]
      );
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

  if (!status) return res.status(400).json({ message: "Status required" });

  try {
    await db.execute("UPDATE tbl_orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: "Order updated" });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrder,
  updateOrderStatus,
};