import db from "../config/db.js";

export const getCategories = (req, res) => {
  db.query("SELECT * FROM tbl_category", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

export const addCategory = (req, res) => {
  const { name } = req.body;
  db.query(
    "INSERT INTO tbl_category (name) VALUES (?)",
    [name],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Category added!" });
    }
  );
};
