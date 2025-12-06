// backend/controllers/toppingController.js
const db = require("../config/db.js");

// GET ALL TOPPINGS
const getAddOns = async (req, res) => {
  try {
    const [toppings] = await db.execute("SELECT * FROM tbl_toppings ORDER BY name ASC");
    res.json(toppings);
  } catch (error) {
    console.error("Get add-ons error:", error);
    res.status(500).json({ message: "Cannot get add-ons!" });
  }
};

module.exports = {
  getAddOns
};