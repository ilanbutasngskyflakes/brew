import db from "../config/db.js";

// Get all tables
export const getTables = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM tbl_tables");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get tables" });
  }
};

// Add a new table
export const addTable = async (req, res) => {
  try {
    const { table_number, status } = req.body;

    if (table_number === undefined || Number.isNaN(Number(table_number))) {
      return res
        .status(400)
        .json({ message: "Invalid or missing table_number" });
    }

    const tblNum = Number(table_number);
    if (!Number.isInteger(tblNum) || tblNum <= 0) {
      return res
        .status(400)
        .json({ message: "table_number must be a positive integer" });
    }

    const [result] = await db.execute(
      "INSERT INTO tbl_tables (table_number, status) VALUES (?, ?)",
      [tblNum, status || "available"]
    );

    res.status(201).json({ id: result.insertId, message: "Table added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot add table" });
  }
};