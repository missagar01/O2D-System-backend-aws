import { pgQuery } from "../config/pg.js";

export async function findUserByUsername(username) {
  const result = await pgQuery(
    `SELECT id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, created_at, updated_at
     FROM users
     WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
}

export async function registerUser({
  username,
  password,
  access = null,
  supervisor_name = null,
  item_name = null,
  quality_controller = null,
  role = null,
  loading_incharge = null,
}) {
  const existing = await findUserByUsername(username);
  if (existing) {
    const err = new Error("Username already exists");
    err.status = 409;
    throw err;
  }

  const result = await pgQuery(
    `INSERT INTO users
      (username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, username, access, supervisor_name, item_name, quality_controller, role, loading_incharge, created_at, updated_at`,
    [username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge]
  );

  return result.rows[0];
}

export async function listUsers() {
  const result = await pgQuery(
    `SELECT id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, created_at, updated_at
     FROM users
     ORDER BY created_at ASC, id ASC`
  );
  return result.rows;
}

export async function findUserById(id) {
  const result = await pgQuery(
    `SELECT id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateUser(id, updates) {
  const {
    username,
    password,
    access,
    supervisor_name,
    item_name,
    quality_controller,
    role,
    loading_incharge,
  } = updates;

  // Build dynamic update set
  const fields = [];
  const values = [];
  let idx = 1;

  const push = (field, value) => {
    fields.push(`${field} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (username !== undefined) push("username", username);
  if (password !== undefined) push("password", password);
  if (access !== undefined) push("access", access);
  if (supervisor_name !== undefined) push("supervisor_name", supervisor_name);
  if (item_name !== undefined) push("item_name", item_name);
  if (quality_controller !== undefined) push("quality_controller", quality_controller);
  if (role !== undefined) push("role", role);
  if (loading_incharge !== undefined) push("loading_incharge", loading_incharge);

  if (!fields.length) {
    const err = new Error("No fields to update");
    err.status = 400;
    throw err;
  }

  const query = `
    UPDATE users
    SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${idx}
    RETURNING id, username, password, access, supervisor_name, item_name, quality_controller, role, loading_incharge, created_at, updated_at
  `;

  values.push(id);
  const result = await pgQuery(query, values);
  return result.rows[0] || null;
}

export async function deleteUser(id) {
  const result = await pgQuery(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount > 0;
}
