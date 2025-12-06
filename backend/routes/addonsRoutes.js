// backend/routes/toppingRoutes.js
const express = require("express");
const router = express.Router();
const addonsController = require("../controllers/addonsController");

// GET all toppings
router.get("/", addonsController.getAddOns);

module.exports = router;