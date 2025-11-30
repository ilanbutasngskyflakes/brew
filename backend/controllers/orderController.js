const db = require("../config/db.js");

// CREATE ORDER
const createOrder = async (req, res) => {
  const { cashier_id, order_type, status, total, items } = req.body;

  if (!cashier_id || total === undefined || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields: cashier_id, total, items" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      "INSERT INTO tbl_orders (cashier_id, order_type, status, total) VALUES (?, ?, ?, ?)",
      [cashier_id, order_type || null, status || "pending", Number(total)]
    );

    const order_id = orderResult.insertId;

    for (const item of items) {
      const { product_id, quantity, subtotal } = item;

      if (!product_id || quantity === undefined) {
        await conn.rollback();
        return res.status(400).json({ message: "Each item must include product_id and quantity" });
      }

      await conn.execute(
        "INSERT INTO tbl_orders_details (product_id, order_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
        [product_id, order_id, Number(quantity), subtotal === undefined ? null : Number(subtotal)]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Order created", order_id });
  } catch (error) {
    console.error("Create order error:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: "Cannot create order" });
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
          `SELECT d.*, p.product_name, d.quantity, d.subtotal, d.product_id
           FROM tbl_orders_details d
           JOIN tbl_products p ON d.product_id = p.id
           WHERE d.order_id = ?`,
          [order.id]
        );
        return { ...order, items };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Cannot get orders" });
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
    res.status(500).json({ message: "Failed to update order" });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};
