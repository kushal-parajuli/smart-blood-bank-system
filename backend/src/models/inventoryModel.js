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
  searchAvailability,
};