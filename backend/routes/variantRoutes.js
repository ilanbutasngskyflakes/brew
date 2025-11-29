const express = require("express");
const { addVariant, updateVariant, deleteVariant, getVariantsByProduct } = require("../controllers/variantController");

const router = express.Router();

router.post("/add", addVariant);
router.put("/:id", updateVariant);
router.delete("/:id", deleteVariant);
router.get("/product/:id", getVariantsByProduct);

module.exports = router;
