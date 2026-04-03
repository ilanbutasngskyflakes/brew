const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const shopFilter = require("../middleware/shopFilter");

// All category routes require shopId
router.use(shopFilter);

router.get("/", categoryController.getCategories);
router.post("/add", categoryController.addCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
