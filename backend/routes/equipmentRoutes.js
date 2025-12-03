const express = require("express");
const router = express.Router();
const equipmentController = require("../controllers/equipmentController");

// Get all equipments
router.get("/", equipmentController.getEquipments);

// Add new equipment
router.post("/add", equipmentController.addEquipment);

// Update equipment by ID
router.put("/:id", equipmentController.updateEquipment);

// Delete equipment by ID
router.delete("/:id", equipmentController.deleteEquipment);

module.exports = router;
