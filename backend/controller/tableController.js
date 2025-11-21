import db from "../config/db.js";

export const getTables = (req, res) => {
  db.query("SELECT * FROM tbl_tables", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

export const addTable = (req, res) => {
  const { table_number, status } = req.body;

  db.query(
    "INSERT INTO tbl_tables (table_number, status) VALUES (?, ?)",
    [table_number, status],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Table added!" });
    }
  );
};
