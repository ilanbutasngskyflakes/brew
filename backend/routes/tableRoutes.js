const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");

router.get("/", tableController.getTables);
router.post("/add", tableController.addTable);

module.exports = router;
