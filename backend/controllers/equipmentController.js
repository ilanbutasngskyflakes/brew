const db = require("../config/db"); // Your MySQL connection

// Get all equipments
exports.getEquipments = (req, res) => {
  const sql = "SELECT * FROM tbl_equipments ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Add new equipment
exports.addEquipment = (req, res) => {
  const { name, qty } = req.body;
  if (!name || qty === undefined) {
    return res.status(400).json({ error: "Name and qty are required" });
  }

  const sql = "INSERT INTO tbl_equipments (name, qty, created_at, updated_at) VALUES (?, ?, NOW(), NOW())";
  db.query(sql, [name, qty], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Equipment added successfully", id: result.insertId });
  });
};

// Update equipment
exports.updateEquipment = (req, res) => {
  const { id } = req.params;
  const { name, qty } = req.body;
  if (!name || qty === undefined) {
    return res.status(400).json({ error: "Name and qty are required" });
  }

  const sql = "UPDATE tbl_equipments SET name = ?, qty = ?, updated_at = NOW() WHERE id = ?";
  db.query(sql, [name, qty, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Equipment updated successfully" });
  });
};

// Delete equipment
exports.deleteEquipment = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tbl_equipments WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Equipment deleted successfully" });
  });
};
