const express = require("express");
const router = express.Router();
const { getPublicMenu, submitPublicOrder } = require("../controllers/publicMenuController");

// Public endpoints - NO authentication required
// GET /public/shop/:shopId/menu - Get full menu for a shop
router.get("/shop/:shopId/menu", getPublicMenu);

// POST /public/orders - Submit a public order
router.post("/orders", submitPublicOrder);

module.exports = router;
