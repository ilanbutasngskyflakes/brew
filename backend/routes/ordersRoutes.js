const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/ordersController");

// POST - Create order
router.post("/", ordersController.createOrder); // ✅ Make sure this exists

// GET - All orders
router.get("/", ordersController.getOrders);

// GET - Single order
router.get("/:id", ordersController.getOrder);

// PUT - Update order
router.put("/:id", ordersController.updateOrder);

// DELETE - Delete order
router.delete("/:id", ordersController.deleteOrder);

module.exports = router;