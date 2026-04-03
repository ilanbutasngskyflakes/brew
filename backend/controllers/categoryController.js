import db from "../config/db.js";

export const getCategories = async (req, res) => {
  try {
    const { shopId } = req;
    const [rows] = await db.execute(
      "SELECT id, name FROM tbl_category WHERE deleted_at IS NULL AND shop_id = ?",
      [shopId]
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
    const { shopId } = req;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Missing or invalid category name" });
    }

    const [result] = await db.execute(
      "INSERT INTO tbl_category (name, shop_id) VALUES (?, ?)",
      [name.trim(), shopId]
    );

    res.status(201).json({ id: result.insertId, message: "Category added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot add category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const [result] = await db.execute(
      "UPDATE tbl_category SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL AND shop_id = ?",
      [id, shopId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found or already deleted" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete category" });
  }
};

