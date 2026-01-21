// backend/controllers/toppingController.js
const db = require("../config/db");

exports.getAddOns = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        name,
        quantity,
        unit,
        price,
        unit_price,
        quantity_per_item,
        is_deleted
      FROM tbl_toppings
      WHERE is_deleted = 0 OR is_deleted IS NULL
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Cannot get add-ons:", error);
    res.status(500).json({ message: "Cannot get add-ons", error: error.message });
  }
};

exports.getAddOn = async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.execute(
      `SELECT 
         id,
         name,
         quantity,
         unit,
         price,
         unit_price,
         quantity_per_item,
         is_deleted
       FROM tbl_toppings
       WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "Add-on not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get add-on" });
  }
};

exports.addAddOn = async (req, res) => {
  try {
    const { name, quantity, unit, price, unit_price, quantity_per_item } = req.body;
    
    if (!name || quantity === undefined || !unit || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    let parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    let parsedUnitPrice = null;
    if (unit_price !== undefined && unit_price !== null) {
      parsedUnitPrice = parseFloat(unit_price);
      if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
        return res.status(400).json({ message: "Invalid unit price" });
      }
    }

    // ✅ Parse quantity_per_item
    let parsedQuantityPerItem = parseFloat(quantity_per_item) || 1;
    if (isNaN(parsedQuantityPerItem) || parsedQuantityPerItem < 0) {
      parsedQuantityPerItem = 1;
    }

    const [result] = await db.execute(
      `INSERT INTO tbl_toppings (name, quantity, unit, price, unit_price, quantity_per_item)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, parsedQuantity, unit, parsedPrice, parsedUnitPrice, parsedQuantityPerItem]
    );

    res.json({
      message: "Add-on saved successfully",
      id: result.insertId,
      name,
      quantity: parsedQuantity,
      unit,
      price: parsedPrice,
      unit_price: parsedUnitPrice,
      quantity_per_item: parsedQuantityPerItem
    });

  } catch (error) {
    console.error("Error saving add-on:", error);
    res.status(500).json({ message: "Error saving add-on", error: error.message });
  }
};

exports.updateAddOn = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, quantity, unit, price, unit_price, quantity_per_item } = req.body;

    if (!name || quantity === undefined || !unit || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    let parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    let parsedUnitPrice = null;
    if (unit_price !== undefined && unit_price !== null) {
      parsedUnitPrice = parseFloat(unit_price);
      if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
        return res.status(400).json({ message: "Invalid unit price" });
      }
    }

    // ✅ Parse quantity_per_item
    let parsedQuantityPerItem = parseFloat(quantity_per_item) || 1;
    if (isNaN(parsedQuantityPerItem) || parsedQuantityPerItem < 0) {
      parsedQuantityPerItem = 1;
    }

    const [result] = await db.execute(
      `UPDATE tbl_toppings 
       SET name=?, quantity=?, unit=?, price=?, unit_price=?, quantity_per_item=?
       WHERE id=?`,
      [name, parsedQuantity, unit, parsedPrice, parsedUnitPrice, parsedQuantityPerItem, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Add-on not found" });
    }

    res.json({ message: "Add-on updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update add-on", error });
  }
};

exports.deleteAddOn = async (req, res) => {
  try {
    const id = req.params.id;

    const [result] = await db.execute(
      "UPDATE tbl_toppings SET is_deleted = 1 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Add-on not found" });
    }

    res.json({ message: "Add-on deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete add-on" });
  }
};