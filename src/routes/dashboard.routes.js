import { Router } from "express";
import { fetchDashboardSummary } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", fetchDashboardSummary);

export default router;



