const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/", orderController.getOrders);             // fetch orders
router.post("/add", orderController.createOrder);       // add order
router.put("/:id", orderController.updateOrderStatus);  // update order status

module.exports = router;
