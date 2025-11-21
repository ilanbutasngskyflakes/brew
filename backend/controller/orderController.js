import db from "../config/db.js";

export const createOrder = (req, res) => {
  const { table_id, cashier_id, order_type, status, total, items } = req.body;

  db.query(
    "INSERT INTO tbl_orders (table_id, cashier_id, order_type, status, total) VALUES (?, ?, ?, ?, ?)",
    [table_id, cashier_id, order_type, status, total],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      const order_id = result.insertId;

      items.forEach(item => {
        db.query(
          "INSERT INTO tbl_orders_details (product_id, order_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
          [item.product_id, order_id, item.quantity, item.subtotal]
        );
      });

      res.json({ message: "Order created", order_id });
    }
  );
};

export const getOrders = (req, res) => {
  db.query(
    "SELECT * FROM tbl_orders",
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
};
