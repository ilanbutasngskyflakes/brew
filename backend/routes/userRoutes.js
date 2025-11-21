const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.post("/add", userController.addUser);
router.post("/auth", userController.verifyUser);
router.patch("/update/:id", userController.updateUser);
router.patch("/:id/change-password", userController.changePassword);
router.delete("/delete/:id", userController.deleteUser);

module.exports = router;