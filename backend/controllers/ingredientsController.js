const db = require("../config/db");

exports.getIngredients = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        i.id,
        i.ingredient_name,
        i.unit,
        inv.quantity
      FROM tbl_ingredients i
      LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
      ORDER BY i.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Cannot get ingredients:", error);
    res.status(500).json({ message: "Cannot get ingredients", error: error.message });
  }
};

exports.getIngredient = async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.execute(
      `SELECT 
         i.id,
         i.ingredient_name,
         i.unit,
         inv.quantity
       FROM tbl_ingredients i
       LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
       WHERE i.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "Ingredient not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get ingredient" });
  }
};

exports.addIngredient = async (req, res) => {
  try {
    const { ingredient_name, unit, quantity } = req.body;
    if (!ingredient_name || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const qty = quantity ?? 0;
    const [ingredientResult] = await db.execute(
      `INSERT INTO tbl_ingredients (ingredient_name, unit)
       VALUES (?, ?)`,
      [ingredient_name, unit]
    );

    const ingredient_id = ingredientResult.insertId;
    const [inventoryResult] = await db.execute(
      `INSERT INTO tbl_inventory (ingredient_id, quantity)
       VALUES (?, ?)`,
      [ingredient_id, qty]
    );

    res.json({
      message: "Ingredient + inventory saved",
      ingredient_id,
      inventory_id: inventoryResult.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving ingredient", error });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const id = req.params.id;
    const { ingredient_name, unit, quantity } = req.body;

    if (!ingredient_name || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Update ingredient info
    const [ingredientResult] = await db.execute(
      `UPDATE tbl_ingredients 
       SET ingredient_name=?, unit=?
       WHERE id=?`,
      [ingredient_name, unit, id]
    );

    if (ingredientResult.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    // Update inventory quantity
    await db.execute(
      `UPDATE tbl_inventory 
       SET quantity=?
       WHERE ingredient_id=?`,
      [quantity ?? 0, id]
    );

    res.json({ message: "Ingredient updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update ingredient", error });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const id = req.params.id;

    // Delete inventory first (foreign key)
    await db.execute("DELETE FROM tbl_inventory WHERE ingredient_id=?", [id]);

    // Delete ingredient
    const [result] = await db.execute("DELETE FROM tbl_ingredients WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    res.json({ message: "Ingredient deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete ingredient" });
  }
};
