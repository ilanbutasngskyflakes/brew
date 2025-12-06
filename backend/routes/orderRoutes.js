const express = require("express");
const router = express.Router();
const { createOrder, getOrders, updateOrder, updateOrderStatus } = require("../controllers/orderController");

// POST /order - create new order
router.post("/", createOrder);

// GET /order - get all orders
router.get("/", getOrders);

// PUT /order/:id - update order
router.put("/:id", updateOrder);

// PATCH /order/:id/status - update order status
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
