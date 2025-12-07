const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.post("/", userController.addUser);
router.post("/auth", userController.verifyUser);
router.put("/:id", userController.updateUser); // Changed to PUT and simplified path
router.put("/change-password/:id", userController.changePassword); // Changed to PUT
router.delete("/:id", userController.deleteUser); // Simplified path

module.exports = router;
