// src/models/userModel.js
//
// All raw SQL touching the `users` (and `roles`) table lives here.
// Controllers never write SQL directly — they call these functions.
// This is our "model" layer since we're using plain mysql2, not an ORM:
// each function is a small, named, testable unit rather than a magic
// query scattered inside a controller.

const { pool } = require("../config/db");

/**
 * Every function below takes an optional `conn` as its last argument,
 * defaulting to the shared `pool`. This lets a caller pass in a dedicated
 * transaction connection instead (see bloodBankController for why this
 * matters: creating a user + a blood_banks row must succeed or fail
 * together, which only works if both queries run on the SAME connection
 * inside a single transaction — the pool alone can't guarantee that,
 * since it may hand out a different connection per query).
 */

/**
 * Looks up a role's numeric id by its name ('user' | 'blood_bank' | 'admin').
 * Used at registration time to convert a role name into the FK stored on users.
 */
async function getRoleIdByName(roleName, conn = pool) {
  const [rows] = await conn.query("SELECT id FROM roles WHERE name = ?", [roleName]);
  return rows.length ? rows[0].id : null;
}

/**
 * Creates a new user row. `passwordHash` must already be hashed (bcrypt) —
 * this function never sees or handles plaintext passwords, that's the
 * controller's responsibility (keeps hashing logic in one predictable place).
 */
async function createUser({ name, email, passwordHash, phone, roleId }, conn = pool) {
  const [result] = await conn.query(
    `INSERT INTO users (role_id, name, email, password_hash, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [roleId, name, email, passwordHash, phone || null]
  );
  return result.insertId;
}

/**
 * Fetches a user by email, joined with their role name — needed at login
 * to verify the password AND to know what role to embed in the JWT.
 */
async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.phone,
            u.is_verified, u.is_suspended, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Fetches a user by id — used by authMiddleware to attach the current
 * user's data to req.user on every protected request, and by the
 * GET /profile route. Password hash intentionally excluded here since
 * this data may be sent back to the client.
 */
async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.is_verified, u.is_suspended,
            u.created_at, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Updates a user's editable profile fields. Deliberately narrow —
 * email/password/role are never touched here (those need their own
 * dedicated, more carefully-guarded flows, not a generic profile edit).
 */
async function updateUser(id, { name, phone }) {
  await pool.query(
    "UPDATE users SET name = ?, phone = ? WHERE id = ?",
    [name, phone || null, id]
  );
}

module.exports = {
  getRoleIdByName,
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
};