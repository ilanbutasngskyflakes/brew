import db from "../config/db.js";

export const getCategories = async (req, res) => {
  try {
    const [rows] = await db.execute(
  "SELECT id, name FROM tbl_category"
);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get categories" });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, shortcut } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Missing or invalid category name" });
    }

    const [result] = await db.execute(
      "INSERT INTO tbl_category (name) VALUES (?)",
      [name.trim()]
    );

    res.status(201).json({ id: result.insertId, message: "Category added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot add category" });
  }
};
