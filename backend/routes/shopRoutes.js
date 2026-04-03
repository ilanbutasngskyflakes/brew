const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

// Get all shops - NO shopFilter (public endpoint for shop selection)
router.get("/", shopController.getAllShops);

// Get single shop by ID - NO shopFilter (needed before shop selection is confirmed)
router.get("/:id", shopController.getShop);

// Update shop branding
router.put("/:id/branding", shopController.updateShopBranding);

module.exports = router;
