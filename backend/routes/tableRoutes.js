import express from "express";
import { getTables, addTable } from "../controllers/tableController.js";

const router = express.Router();

router.get("/", getTables);
router.post("/", addTable);

export default router;
