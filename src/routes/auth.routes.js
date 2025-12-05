import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleListUsers,
  handleGetUser,
  handleUpdateUser,
  handleDeleteUser,
  handleBulkUpdatePermissions,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/users", handleListUsers);
router.get("/users/:id", handleGetUser);
router.put("/users/:id", handleUpdateUser);
router.delete("/users/:id", handleDeleteUser);
router.post("/users/permissions", authenticate, handleBulkUpdatePermissions);

export default router;


