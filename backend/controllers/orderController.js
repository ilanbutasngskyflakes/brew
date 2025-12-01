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

//     const [orderResult] = await conn.execute(
//       "INSERT INTO tbl_orders (cashier_id, order_type, status, total) VALUES (?, ?, ?, ?)",
//       [cashier_id, order_type || null, status || "pending", Number(total)]
//     );

//     const order_id = orderResult.insertId;

//     for (const item of items) {
//       const { product_id, quantity, subtotal } = item;

//       if (!product_id || quantity === undefined) {
//         await conn.rollback();
//         return res.status(400).json({ message: "Each item must include product_id and quantity" });
//       }

//       await conn.execute(
//         "INSERT INTO tbl_orders_details (product_id, order_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
//         [product_id, order_id, Number(quantity), subtotal === undefined ? null : Number(subtotal)]
//       );
//     }

//     await conn.commit();
//     res.status(201).json({ message: "Order created", order_id });
//   } catch (error) {
//     console.error("Create order error:", error);
//     if (conn) await conn.rollback();
//     res.status(500).json({ message: "Cannot create order" });
//   } finally {
//     if (conn) conn.release();
//   }
// };


// const getOrders = async (req, res) => {
//   try {
//     const [orders] = await db.execute("SELECT * FROM tbl_orders ORDER BY created_at DESC");

//     const ordersWithItems = await Promise.all(
//       orders.map(async (order) => {
//         const [items] = await db.execute(
//           `SELECT d.*, p.product_name, d.quantity, d.subtotal, d.product_id
//            FROM tbl_orders_details d
//            JOIN tbl_products p ON d.product_id = p.id
//            WHERE d.order_id = ?`,
//           [order.id]
//         );
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
//     res.status(500).json({ message: "Failed to update order" });
//   }
// };

// module.exports = {
//   createOrder,
//   getOrders,
//   updateOrderStatus,
// };
// backend/controllers/orderController.js
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

    // 1️⃣ Insert order
    const [orderResult] = await conn.execute(
      "INSERT INTO tbl_orders (cashier_id, order_type, status, total) VALUES (?, ?, ?, ?)",
      [cashier_id, order_type || null, status || "pending", Number(total)]
    );

    const order_id = orderResult.insertId;

    // 2️⃣ Process each item
    for (const item of items) {
      const { product_id, variant_id, quantity, subtotal } = item;

      if (!product_id || !variant_id || quantity === undefined) {
        await conn.rollback();
        return res.status(400).json({ message: "Each item must include product_id, variant_id, and quantity" });
      }

      // Check variant stock
      const [variantRows] = await conn.execute(
        "SELECT quantity FROM tbl_product_variants WHERE id = ? AND product_id = ?",
        [variant_id, product_id]
      );

      if (variantRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ message: `Variant not found for product ${product_id}` });
      }

      const currentStock = variantRows[0].quantity;

      if (currentStock < quantity) {
        await conn.rollback();
        return res.status(400).json({
          message: `Not enough stock for product_id ${product_id}, variant_id ${variant_id}`
        });
      }

      // Insert order item
      await conn.execute(
        "INSERT INTO tbl_orders_details (order_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
        [order_id, product_id, Number(quantity), subtotal === undefined ? null : Number(subtotal)]
      );

      // Deduct stock
      await conn.execute(
        "UPDATE tbl_product_variants SET quantity = quantity - ? WHERE id = ?",
        [Number(quantity), variant_id]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Order created", order_id });
  } catch (error) {
    console.error("Create order error:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: "Cannot create order", error });
  } finally {
    if (conn) conn.release();
  }
};

// GET ORDERS
// const getOrders = (req, res) => {
//   // First, get all orders
//   const ordersQuery = "SELECT * FROM tbl_orders ORDER BY id DESC";
  
//   db.query(ordersQuery, (err, orders) => {
//     if (err) {
//       console.error("Failed to fetch orders:", err);
//       return res.status(500).json({ message: "Failed to fetch orders" });
//     }

//     if (orders.length === 0) return res.json([]);

//     // For each order, fetch its items
//     const orderIds = orders.map(o => o.id);
    
//     const itemsQuery = `
//       SELECT d.*, p.product_name, v.name AS variant_name
//       FROM tbl_orders_details d
//       JOIN tbl_products p ON d.product_id = p.id
//       LEFT JOIN tbl_product_variants v ON d.variant_id = v.id
//       WHERE d.order_id IN (?)
//     `;

//     db.query(itemsQuery, [orderIds], (err, items) => {
//       if (err) {
//         console.error("Failed to fetch order items:", err);
//         return res.status(500).json({ message: "Failed to fetch order items" });
//       }

//       // Attach items to their orders
//       const ordersWithItems = orders.map(order => ({
//         ...order,
//         items: items.filter(item => item.order_id === order.id)
//       }));

//       res.json(ordersWithItems);
//     });
//   });
// };

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
    res.status(500).json({ message: "Failed to update order", error });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};
