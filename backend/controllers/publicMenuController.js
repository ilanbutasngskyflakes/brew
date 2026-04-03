const db = require("../config/db.js");

// Get full menu for a specific shop (public endpoint)
const getPublicMenu = async (req, res) => {
  const { shopId } = req.params;

  if (!shopId || isNaN(shopId)) {
    return res.status(400).json({ message: "Invalid shop ID" });
  }

  try {
    // Get shop info
    const [shops] = await db.execute(
      "SELECT id, name, has_tax, is_active, logo_url, receipt_header, receipt_footer, COALESCE(brand_color, '#073dbe') as brand_color FROM tbl_shops WHERE id = ? AND is_active = 1",
      [shopId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const shop = shops[0];

    // Get categories for this shop
    const [categories] = await db.execute(
      "SELECT id, name FROM tbl_category WHERE shop_id = ? AND deleted_at IS NULL ORDER BY name",
      [shopId]
    );

    // Get products for this shop with variants
    const [products] = await db.execute(
      "SELECT * FROM tbl_products WHERE shop_id = ? AND is_deleted = 0 ORDER BY id DESC",
      [shopId]
    );

    // Get toppings for this shop
    const [toppings] = await db.execute(
      "SELECT id, name, price FROM tbl_toppings WHERE shop_id = ? AND is_deleted = 0 ORDER BY name",
      [shopId]
    );

    // Get ingredients for this shop
    const [ingredients] = await db.execute(
      "SELECT id, ingredient_name as name FROM tbl_ingredients WHERE shop_id = ? AND is_deleted = 0 ORDER BY ingredient_name",
      [shopId]
    );

    // Get add-ons for this shop (add-ons are in tbl_toppings)
    const [addOns] = await db.execute(
      "SELECT id, name, price FROM tbl_toppings WHERE shop_id = ? AND is_deleted = 0 ORDER BY name",
      [shopId]
    );

    // Get variants for all products in this shop
    const [variants] = await db.execute(
      `SELECT v.id, v.product_id, v.name, v.price, p.product_name
       FROM tbl_product_variants v
       JOIN tbl_products p ON v.product_id = p.id
       WHERE v.product_id IN (SELECT id FROM tbl_products WHERE shop_id = ?)
       ORDER BY v.product_id, v.name`,
      [shopId]
    );

    // Build product structure with variants
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: variants
        .filter(v => v.product_id === product.id)
        .map(v => ({
          ...v,
          name: v.name && v.name.trim() ? v.name : `${product.product_name}`
        }))
    }));

    // Group products by category
    const menuByCategory = categories.map(category => ({
      ...category,
      products: productsWithVariants.filter(p => p.category_id === category.id)
    }));

    res.json({
      shop,
      categories: menuByCategory,
      toppings,
      ingredients,
      addOns
    });

  } catch (error) {
    console.error("Error fetching public menu:", error);
    res.status(500).json({ message: "Cannot fetch menu", error: error.message });
  }
};

// Submit public order (no authentication required)
const submitPublicOrder = async (req, res) => {
  const { shopId, items, customerName, customerPhone, customerEmail, orderType, total, discount, discountType, paid, change } = req.body;

  if (!shopId || !items || items.length === 0 || !customerPhone) {
    return res.status(400).json({ message: "Missing required fields: shopId, items, customerPhone" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Create order
    const [result] = await conn.execute(
      `INSERT INTO tbl_orders 
       (shop_id, cashier_id, order_type, status, total, discounted, discount, discount_type, paid, \`change\`, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [shopId, null, orderType || "takeout", "pending", total, (discount || 0), discount || 0, discountType || null, paid || total, change || 0]
    );

    const orderId = result.insertId;

    // Insert order items
    for (const item of items) {
      const [itemResult] = await conn.execute(
        `INSERT INTO tbl_orders_details 
         (order_id, variant_id, quantity, subtotal, discount, discount_type, topping_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.variant_id || null, item.quantity, item.subtotal, item.discount || 0, item.discount_type || null, item.topping_id || null]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({ 
      message: "Order submitted successfully", 
      order_id: orderId,
      customer_info: {
        name: customerName || "Guest",
        phone: customerPhone,
        email: customerEmail
      }
    });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Error submitting public order:", error);
    res.status(500).json({ message: "Cannot submit order", error: error.message });
  }
};

module.exports = {
  getPublicMenu,
  submitPublicOrder
};
