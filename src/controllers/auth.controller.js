import jwt from "jsonwebtoken";
import {
  registerUser,
  findUserByUsername,
  listUsers,
  findUserById,
  updateUser,
  deleteUser,
} from "../services/auth.service.js";

function signToken(user) {
  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "30d";

  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
}

export async function handleRegister(req, res) {
  try {
    const {
      username,
      password,
      access,
      supervisor_name,
      item_name,
      quality_controller,
      role,
      loading_incharge,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password are required" });
    }

    const user = await registerUser({
      username,
      password, // storing as-is (no hashing) per request
      access,
      supervisor_name,
      item_name,
      quality_controller,
      role,
      loading_incharge,
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
}

export async function handleLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password are required" });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Plain-text comparison per requirement (no hashing)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          access: user.access,
          supervisor_name: user.supervisor_name,
          item_name: user.item_name,
          quality_controller: user.quality_controller,
          role: user.role,
          loading_incharge: user.loading_incharge,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        token,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Login failed",
    });
  }
}

// Stateless logout: client should discard token; provided for symmetry
export async function handleLogout(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logged out (client should discard token)",
  });
}

export async function handleListUsers(req, res) {
  try {
    const users = await listUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch users" });
  }
}

export async function handleGetUser(req, res) {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch user" });
  }
}

export async function handleUpdateUser(req, res) {
  try {
    const updated = await updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || "Failed to update user" });
  }
}

export async function handleDeleteUser(req, res) {
  try {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to delete user" });
  }
}
