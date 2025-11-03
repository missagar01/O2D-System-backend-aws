import { Router } from "express";
import {
  fetchPendingInvoiceData,
  fetchInvoiceHistoryData,
} from "../controllers/invoice.controller.js";

const router = Router();

router.get("/pending", fetchPendingInvoiceData);
router.get("/history", fetchInvoiceHistoryData);

export default router;
