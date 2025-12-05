import { Router } from "express";
import firstWeightRoutes from "./firstWeight.routes.js";
import secondWeightRoutes from "./secondWeight.routes.js";
import invoiceRoutes from "./invoice.routes.js";
import gateOutRoutes from "./gateOut.routes.js";
import paymentRoutes from "./payment.routes.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/first-weight", firstWeightRoutes);
router.use("/second-weight", secondWeightRoutes);
router.use("/invoice", invoiceRoutes);
router.use("/gate-out", gateOutRoutes);
router.use("/payment", paymentRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
