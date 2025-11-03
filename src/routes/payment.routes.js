import { Router } from "express";
import {
  fetchPendingPayments,
  fetchPaymentHistory,
  fetchAllPaymentCustomers,
} from "../controllers/payment.controller.js";

const router = Router();

router.get("/pending", fetchPendingPayments);
router.get("/history", fetchPaymentHistory);
router.get("/customers", fetchAllPaymentCustomers);

export default router;
