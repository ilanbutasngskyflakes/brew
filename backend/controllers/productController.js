import db from "../config/db.js";

export const getProducts = async (req, res) => {
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

export const addProduct = async (req, res) => {
  try {
    const {
      category_id,
      product_name,
      product_description,
      price,
      image,
      status,
    } = req.body;

    if (
      !category_id ||
      !product_name ||
      price === undefined ||
      Number.isNaN(Number(price))
    ) {
      return res.status(400).json({
        message:
          "Missing or invalid required fields: category_id, product_name, price",
      });
    }

    const [result] = await db.execute(
      "INSERT INTO tbl_products (category_id, product_name, product_description, price, image, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        category_id,
        product_name,
        product_description || null,
        Number(price),
        image || null,
        status || "active",
      ]
    );

    res.status(201).json({ id: result.insertId, message: "Product added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot add product" });
  }
};