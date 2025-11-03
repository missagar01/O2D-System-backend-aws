import { Router } from "express";
import {
  fetchPendingSecondWeight,
  fetchSecondWeightHistory,
} from "../controllers/secondWeight.controller.js";

const router = Router();

router.get("/pending", fetchPendingSecondWeight);
router.get("/history", fetchSecondWeightHistory);

export default router;
