// // backend/controllers/variantController.js
// import db from "../config/db.js";

// export const addVariant = async (req, res) => {
//   try {
//     const { product_id, name, quantity, price, status } = req.body;
//     if (!product_id || !name || quantity == null || price == null) 
//       return res.status(400).json({ message: "All fields required" });

//     const [result] = await db.query(
//       "INSERT INTO tbl_product_variants (product_id, name, quantity, price, status) VALUES (?, ?, ?, ?, ?)",
//       [product_id, name, quantity, price, status]
//     );

//     res.json({ id: result.insertId, product_id, name, quantity, price, status });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Cannot add variant", error: err });
//   }
// };

// export const updateVariant = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, quantity, price, status } = req.body;

//     await db.query(
//       "UPDATE tbl_product_variants SET name=?, quantity=?, price=?, status=? WHERE id=?",
//       [name, quantity, price, status, id]
//     );

//     res.json({ message: "Variant updated successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Cannot update variant", error: err });
//   }
// };

// export const deleteVariant = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await db.query("DELETE FROM tbl_product_variants WHERE id=?", [id]);
//     res.json({ message: "Variant deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Cannot delete variant", error: err });
//   }
// };

// export const getVariantsByProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [rows] = await db.query("SELECT * FROM tbl_product_variants WHERE product_id=?", [id]);
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Cannot get variants", error: err });
//   }
// };
import db from "../config/db.js";

// ADD VARIANT
export const addVariant = async (req, res) => {
  try {
    const { product_id, name, quantity, price, status } = req.body;

    // Validate input
    if (!product_id || !name || quantity == null || price == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Insert into database
    const [result] = await db.query(
      "INSERT INTO tbl_product_variants (product_id, name, quantity, price, status) VALUES (?, ?, ?, ?, ?)",
      [product_id, name, quantity, price, status || "active"]
    );

    res.status(201).json({
      id: result.insertId,
      product_id,
      name,
      quantity,
      price,
      status: status || "active"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot add variant", error: err });
  }
};

// UPDATE VARIANT
export const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, status } = req.body;

    if (!id || !name || quantity == null || price == null || !status) {
      return res.status(400).json({ message: "All fields are required for update" });
    }

    const [result] = await db.query(
      "UPDATE tbl_product_variants SET name=?, quantity=?, price=?, status=? WHERE id=?",
      [name, quantity, price, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Variant not found" });
    }

    res.json({ message: "Variant updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot update variant", error: err });
  }
};

// DELETE VARIANT
export const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM tbl_product_variants WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Variant not found" });
    }

    res.json({ message: "Variant deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot delete variant", error: err });
  }
};

// GET VARIANTS BY PRODUCT
export const getVariantsByProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM tbl_product_variants WHERE product_id=?",
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot get variants", error: err });
  }
};
