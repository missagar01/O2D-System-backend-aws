import { Router } from "express";
import firstWeightRoutes from "./firstWeight.routes.js"; // 👈 Add this
import secondWeightRoutes from "./secondWeight.routes.js"; // 👈 Add this
import invoiceRoutes from "./invoice.routes.js"; // 👈 Add this
import gateOutRoutes from "./gateOut.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = Router();

router.use("/first-weight", firstWeightRoutes);
router.use("/second-weight", secondWeightRoutes);
router.use("/invoice", invoiceRoutes);
router.use("/gate-out", gateOutRoutes);
router.use("/payment", paymentRoutes);

export default router;
