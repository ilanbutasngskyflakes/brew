// backend/routes/toppingRoutes.js
const express = require("express");
const router = express.Router();
const addOnsController = require("../controllers/addonsController");
const shopFilter = require("../middleware/shopFilter");

// All add-on routes require shopId
router.use(shopFilter);

// GET all add-ons
router.get("/", addOnsController.getAddOns);

// GET single add-on by ID
router.get("/:id", addOnsController.getAddOn);

// CREATE new add-on
router.post("/add", addOnsController.addAddOn);  // ✅ POST to /add

// UPDATE add-on
router.put("/:id", addOnsController.updateAddOn);

// DELETE add-on
router.delete("/:id", addOnsController.deleteAddOn);

module.exports = router;