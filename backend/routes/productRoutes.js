const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const variantController = require("../controllers/variantController");
const multer = require("multer");
const path = require("path");
const shopFilter = require("../middleware/shopFilter");

// -------------------- MULTER CONFIG --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images are allowed"), false);
};

const upload = multer({ storage, fileFilter });

// All product routes require shopId
router.use(shopFilter);

// -------------------- PRODUCT ROUTES --------------------

// Get all products
// router.get("/", productController.getProducts);
router.get("/", productController.getProductsFull);

// Get single product + its variants
router.get("/:id", productController.getProductWithVariants);

// Add product (image optional)
// router.post("/add", upload.single("image"), productController.addProduct);
router.post("/add", upload.single("image"), productController.addProductFull);

// Update product (image optional)
router.put("/:id", upload.single("image"), productController.updateProduct);

// Soft delete product
router.delete("/:id", productController.deleteProduct);

// -------------------- VARIANT ROUTES --------------------

// Add variant
router.post("/variants/add", variantController.addVariant);

// Get variants by product
router.get("/:id/variants", variantController.getVariantsByProduct);

module.exports = router;
