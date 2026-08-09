// src/models/inventoryModel.js
//
// All raw SQL touching `blood_inventory`. Each row is one "batch" of
// blood (a bank can have multiple batches of the same group with
// different collection/expiry dates — matches how real blood banks
// track stock, not just a single running total per group).

const { pool } = require("../config/db");

async function createBatch({ bloodBankId, bloodGroup, quantityUnits, collectionDate, expiryDate }) {
  const [result] = await pool.query(
    `INSERT INTO blood_inventory (blood_bank_id, blood_group, quantity_units, collection_date, expiry_date)
     VALUES (?, ?, ?, ?, ?)`,
    [bloodBankId, bloodGroup, quantityUnits, collectionDate || null, expiryDate || null]
  );
  return result.insertId;
}

async function findBatchById(id) {
  const [rows] = await pool.query("SELECT * FROM blood_inventory WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findBatchesByBankId(bloodBankId) {
  const [rows] = await pool.query(
    "SELECT * FROM blood_inventory WHERE blood_bank_id = ? ORDER BY blood_group, expiry_date",
    [bloodBankId]
  );
  return rows;
}

async function updateBatchQuantity(id, quantityUnits) {
  await pool.query(
    "UPDATE blood_inventory SET quantity_units = ? WHERE id = ?",
    [quantityUnits, id]
  );
}

async function deleteBatch(id) {
  await pool.query("DELETE FROM blood_inventory WHERE id = ?", [id]);
}

/**
 * Deducts `unitsNeeded` units of a blood group from a bank's stock using
 * FEFO — First-Expired-First-Out: batches closest to expiry are used up
 * before newer ones. This mirrors real blood bank practice (use the stock
 * that will expire soonest, don't let it go to waste while newer stock
 * sits untouched) rather than just decrementing an arbitrary batch.
 *
 * MUST be called with a transaction connection, not the bare pool —
 * `FOR UPDATE` locks the selected rows for the duration of the transaction
 * so two simultaneous requests can't both "see" the same stock as available
 * and double-allocate it (a real race condition risk once multiple users
 * can request from the same bank concurrently).
 *
 * Throws (with statusCode 409) if the bank's total stock for that group
 * is less than unitsNeeded — the caller's transaction should then roll
 * back, leaving inventory untouched.
 */
async function deductUnitsFEFO(bloodBankId, bloodGroup, unitsNeeded, conn) {
  const [batches] = await conn.query(
    `SELECT id, quantity_units FROM blood_inventory
     WHERE blood_bank_id = ? AND blood_group = ? AND quantity_units > 0
     ORDER BY expiry_date ASC
     FOR UPDATE`,
    [bloodBankId, bloodGroup]
  );

  let remaining = unitsNeeded;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const deduct = Math.min(batch.quantity_units, remaining);
    await conn.query(
      "UPDATE blood_inventory SET quantity_units = quantity_units - ? WHERE id = ?",
      [deduct, batch.id]
    );
    remaining -= deduct;
  }

  if (remaining > 0) {
    const err = new Error(
      `Insufficient stock: only ${unitsNeeded - remaining} of ${unitsNeeded} requested units available.`
    );
    err.statusCode = 409;
    throw err;
  }
}

/**
 * Public search: for a given blood group (and optionally a city filter),
 * finds banks that have that group in stock — aggregated across all of a
 * bank's batches (a bank might have 3 separate O+ batches; the searcher
 * cares about the total, not individual batch rows).
 *
 * Only returns banks with a positive total (HAVING clause) — a bank
 * with 0 units of a group shouldn't appear as a "result" for it.
 * This is the query the blood-request flow will build on next.
 */
async function searchAvailability({ bloodGroup, city }) {
  const params = [bloodGroup];
  let query = `
    SELECT
      bb.id AS blood_bank_id,
      bb.bank_name,
      bb.city,
      bb.district,
      bb.province,
      bb.latitude,
      bb.longitude,
      bb.is_verified_by_admin,
      SUM(bi.quantity_units) AS total_units
    FROM blood_inventory bi
    JOIN blood_banks bb ON bi.blood_bank_id = bb.id
    WHERE bi.blood_group = ?
  `;

  if (city) {
    query += " AND bb.city = ? ";
    params.push(city);
  }

  query += " GROUP BY bb.id HAVING total_units > 0 ORDER BY total_units DESC";

  const [rows] = await pool.query(query, params);
  return rows;
}

module.exports = {
  createBatch,
  findBatchById,
  findBatchesByBankId,
  updateBatchQuantity,
  deleteBatch,
  deductUnitsFEFO,
  searchAvailability,
};