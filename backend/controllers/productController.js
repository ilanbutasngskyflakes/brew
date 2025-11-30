const db = require("../config/db");

// -------------------- GET ALL PRODUCTS --------------------
// exports.getProducts = async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       "SELECT id, category_id, product_name, product_description, image, created_at FROM tbl_products WHERE is_deleted = 0 ORDER BY created_at DESC"
//     );
//     res.json(rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Cannot get products" });
//   }
// };

exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
         p.id,
         p.category_id,
         c.name AS category_name,
         p.product_name,
         p.product_description,
         p.image,
         p.created_at
       FROM tbl_products p
       LEFT JOIN tbl_category c ON p.category_id = c.id
       WHERE p.is_deleted = 0
       ORDER BY p.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Cannot get products:", error);
    res.status(500).json({ message: "Cannot get products", error: error.message });
  }
};

// -------------------- GET SINGLE PRODUCT + VARIANTS --------------------
exports.getProductWithVariants = async (req, res) => {
  try {
    const id = req.params.id;
    const [products] = await db.execute("SELECT * FROM tbl_products WHERE id = ?", [id]);
    if (!products.length) return res.status(404).json({ message: "Product not found" });
    const product = products[0];

    const [variants] = await db.execute("SELECT * FROM tbl_product_variants WHERE product_id = ?", [id]);

    res.json({ product, variants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get product" });
  }
};

// -------------------- ADD PRODUCT --------------------
// exports.addProduct = async (req, res) => {
//   try {
//     const { category_id, product_name, product_description } = req.body;
//     const image = req.file ? req.file.filename : null;

//     if (!category_id || !product_name || !product_description || !image) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const [result] = await db.execute(
//       "INSERT INTO tbl_products (category_id, product_name, product_description, image) VALUES (?, ?, ?, ?)",
//       [category_id, product_name, product_description, image]
//     );

//     res.json({
//       message: "Product added successfully",
//       product_id: result.insertId
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error saving product", error });
//   }
// };


// // -------------------- UPDATE PRODUCT --------------------
// exports.updateProduct = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { category_id, product_name, product_description } = req.body;
//     const image = req.file ? req.file.filename : req.body.image || null;

//     const [result] = await db.execute(
//       "UPDATE tbl_products SET category_id=?, product_name=?, product_description=?, image=? WHERE id=?",
//       [category_id, product_name, product_description || null, image, id]
//     );

//     if (result.affectedRows === 0)
//       return res.status(404).json({ message: "Product not found" });

//     res.json({ message: "Product updated" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Cannot update product" });
//   }
// };

exports.addProduct = async (req, res) => {
  try {
    const { category_id, product_name, product_description } = req.body;
    const image = req.file ? req.file.filename : null;

    // Only category_id and product_name are required
    if (!category_id || !product_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.execute(
      `INSERT INTO tbl_products 
       (category_id, product_name, product_description, image) 
       VALUES (?, ?, ?, ?)`,
      [category_id, product_name, product_description || null, image]
    );

    res.json({
      message: "Product added successfully",
      product_id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving product", error });
  }
};

// -------------------- UPDATE PRODUCT --------------------
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { category_id, product_name, product_description } = req.body;
    const image = req.file ? req.file.filename : req.body.image || null;

    if (!category_id || !product_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.execute(
      `UPDATE tbl_products 
       SET category_id=?, product_name=?, product_description=?, image=? 
       WHERE id=?`,
      [category_id, product_name, product_description || null, image, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update product", error });
  }
};

// -------------------- DELETE PRODUCT (SOFT DELETE) --------------------
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.execute("UPDATE tbl_products SET is_deleted = 1 WHERE id=?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete product" });
  }
};
