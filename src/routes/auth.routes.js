import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleListUsers,
  handleGetUser,
  handleUpdateUser,
  handleDeleteUser,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/users", handleListUsers);
router.get("/users/:id", handleGetUser);
router.put("/users/:id", handleUpdateUser);
router.delete("/users/:id", handleDeleteUser);

export default router;
