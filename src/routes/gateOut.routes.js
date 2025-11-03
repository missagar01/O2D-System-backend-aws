import { Router } from "express";
import { fetchPendingGateOut, fetchGateOutHistory, fetchAllGateOutCustomers } from "../controllers/gateOut.controller.js";

const router = Router();

router.get("/pending", fetchPendingGateOut);
router.get("/history", fetchGateOutHistory);
router.get("/customers", fetchAllGateOutCustomers); // ✅ New route

export default router;
