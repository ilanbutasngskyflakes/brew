const db = require("../config/db");

exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, category_id, product_name, product_description, price, image, status FROM tbl_products WHERE is_deleted = 0"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get products" });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { category_id, product_name, product_description, price, status } = req.body;
    const image = req.file ? req.file.filename : null; // multer stores the filename

    if (!category_id || !product_name || price === undefined) {
      return res.status(400).json({ message: "Missing required: category_id, product_name, price" });
    }

    const [result] = await db.execute(
      "INSERT INTO tbl_products (category_id, product_name, product_description, price, image, status) VALUES (?, ?, ?, ?, ?, ?)",
      [category_id, product_name, product_description || null, Number(price), image, status || "active"]
    );

    res.status(201).json({ id: result.insertId, message: "Product added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot add product" });
  }
};

/* ------------------ UPDATE PRODUCT ------------------ */
// backend/controllers/productController.js
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { category_id, product_name, product_description, price, status, image: oldImage } = req.body;

    // Use new file if uploaded, else old image
    const image = req.file ? req.file.filename : oldImage;

    const [result] = await db.execute(
      `UPDATE tbl_products SET category_id=?, product_name=?, product_description=?, price=?, image=?, status=? WHERE id=? AND is_deleted=0`,
      [category_id, product_name, product_description, Number(price), image, status, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update product" });
  }
};


/* ------------------ DELETE PRODUCT (SOFT DELETE) ------------------ */
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const [result] = await db.execute(
      "UPDATE tbl_products SET is_deleted = 1 WHERE id=?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete product" });
  }
};
