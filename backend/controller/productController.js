import db from "../config/db.js";

export const getProducts = (req, res) => {
  db.query(
    "SELECT * FROM tbl_products",
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
};

export const addProduct = (req, res) => {
  const { category_id, product_name, product_description, price, image, status } = req.body;

  db.query(
    "INSERT INTO tbl_products (category_id, product_name, product_description, price, image, status) VALUES (?, ?, ?, ?, ?, ?)",
    [category_id, product_name, product_description, price, image, status],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Product added!" });
    }
  );
};
