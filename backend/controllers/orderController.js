// ...existing code...
import db from "../config/db.js";

export const createOrder = async (req, res) => {
  const { table_id, cashier_id, order_type, status, total, items } = req.body;

  if (
    !table_id ||
    !cashier_id ||
    total === undefined ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Missing required fields: table_id, cashier_id, total, items",
    });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      "INSERT INTO tbl_orders (table_id, cashier_id, order_type, status, total) VALUES (?, ?, ?, ?, ?)",
      [
        table_id,
        cashier_id,
        order_type || null,
        status || "pending",
        Number(total),
      ]
    );

    const order_id = orderResult.insertId;

    for (const item of items) {
      const { product_id, quantity, subtotal } = item;
      if (!product_id || quantity === undefined) {
        await conn.rollback();
        return res
          .status(400)
          .json({ message: "Each item must include product_id and quantity" });
      }

      await conn.execute(
        "INSERT INTO tbl_orders_details (product_id, order_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
        [
          product_id,
          order_id,
          Number(quantity),
          subtotal === undefined ? null : Number(subtotal),
        ]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Order created", order_id });
  } catch (error) {
    console.error(error);
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        /* ignore */
      }
    }
    res.status(500).json({ message: "Cannot create order" });
  } finally {
    if (conn) conn.release();
  }
};

export const getOrders = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM tbl_orders");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get orders" });
  }
};
