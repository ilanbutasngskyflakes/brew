const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", productController.getProducts);
router.post("/add", upload.single("image"), productController.addProduct);
router.put("/:id", upload.single("image"), productController.updateProduct);    
router.delete("/:id", productController.deleteProduct);

module.exports = router;
