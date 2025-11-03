import { Router } from "express";
import usersRoutes from "./users.routes.js";
import storeIndentRoutes from "./storeIndent.routes.js";
import vendorRateUpdateRoutes from "./vendorRateUpdate.routes.js";
import threePartyApprovalRoutes from "./threePartyApproval.routes.js";
import firstWeightRoutes from "./firstWeight.routes.js"; // 👈 Add this
import gateOutRoutes from "./gateOut.routes.js";
import invoiceRoutes from "./invoice.routes.js";

const router = Router();

router.use("/users", usersRoutes);
router.use("/store-indent", storeIndentRoutes);
router.use("/vendor-rate-update", vendorRateUpdateRoutes);
router.use("/three-party-approval", threePartyApprovalRoutes);
router.use("/first-weight", firstWeightRoutes); // 👈 Add this
router.use("/gate-out", gateOutRoutes);
router.use("/invoice", invoiceRoutes); 

export default router;
