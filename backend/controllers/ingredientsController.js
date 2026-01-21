const db = require("../config/db");

exports.getIngredients = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        i.id,
        i.ingredient_name,
        i.unit,
        i.unit_price,
        inv.quantity
      FROM tbl_ingredients i
      LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
      WHERE i.is_deleted = 0
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
         i.unit_price,
         inv.quantity
       FROM tbl_ingredients i
       LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
       WHERE i.id = ? AND i.is_deleted = 0`,
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
    const { ingredient_name, unit, quantity, unit_price } = req.body;
    if (!ingredient_name || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate unit_price (optional, but if provided, must be a number >= 0)
    let price = null;
    if (unit_price !== undefined) {
      price = parseFloat(unit_price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Invalid unit price" });
      }
    }

    // Only set quantity if provided; otherwise store NULL so it's "unknown" until stocked
    const qty = (quantity === undefined || quantity === null || quantity === "") ? null : Number(quantity);
    // Insert with unit_price if provided
    let ingredientResult;
    if (price !== null) {
      [ingredientResult] = await db.execute(
        `INSERT INTO tbl_ingredients (ingredient_name, unit, unit_price, is_deleted)
         VALUES (?, ?, ?, 0)`,
        [ingredient_name, unit, price]
      );
    } else {
      [ingredientResult] = await db.execute(
        `INSERT INTO tbl_ingredients (ingredient_name, unit, is_deleted)
         VALUES (?, ?, 0)`,
        [ingredient_name, unit]
      );
    }

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
    const { ingredient_name, unit, quantity, unit_price } = req.body;

    if (!ingredient_name || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate unit_price if provided
    let price = null;
    if (unit_price !== undefined) {
      price = parseFloat(unit_price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Invalid unit price" });
      }
    }

    // Update ingredient info (include unit_price if provided)
    let ingredientResult;
    if (price !== null) {
      [ingredientResult] = await db.execute(
        `UPDATE tbl_ingredients 
         SET ingredient_name=?, unit=?, unit_price=?
         WHERE id=? AND is_deleted = 0`,
        [ingredient_name, unit, price, id]
      );
    } else {
      [ingredientResult] = await db.execute(
        `UPDATE tbl_ingredients 
         SET ingredient_name=?, unit=?
         WHERE id=? AND is_deleted = 0`,
        [ingredient_name, unit, id]
      );
    }

    if (ingredientResult.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    // Update inventory quantity
    // Only update inventory quantity if provided in the request
    if (quantity !== undefined) {
      const qtyToSet = (quantity === null || quantity === "") ? null : Number(quantity);
      await db.execute(
        `UPDATE tbl_inventory 
         SET quantity=?
         WHERE ingredient_id=?`,
        [qtyToSet, id]
      );
    }

    res.json({ message: "Ingredient updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update ingredient", error });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const id = req.params.id;

    // Soft delete: mark ingredient as deleted instead of removing it
    const [result] = await db.execute(
      "UPDATE tbl_ingredients SET is_deleted = 1 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    res.json({ message: "Ingredient deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete ingredient" });
  }
};
