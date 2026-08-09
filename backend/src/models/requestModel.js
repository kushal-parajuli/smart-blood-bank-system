// src/models/requestModel.js

const { pool } = require("../config/db");

async function createRequest({
  requesterId, bloodBankId, bloodGroup, unitsNeeded, urgency, aiSessionId, notes,
}, conn = pool) {
  const [result] = await conn.query(
    `INSERT INTO blood_requests
       (requester_id, blood_bank_id, blood_group, units_needed, urgency, ai_session_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      requesterId,
      bloodBankId || null,
      bloodGroup,
      unitsNeeded,
      urgency || "normal",
      aiSessionId || null,
      notes || null,
    ]
  );
  return result.insertId;
}

async function findRequestById(id, conn = pool) {
  const [rows] = await conn.query("SELECT * FROM blood_requests WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findRequestsByRequester(requesterId) {
  const [rows] = await pool.query(
    `SELECT br.*, bb.bank_name
     FROM blood_requests br
     LEFT JOIN blood_banks bb ON br.blood_bank_id = bb.id
     WHERE br.requester_id = ?
     ORDER BY br.created_at DESC`,
    [requesterId]
  );
  return rows;
}

async function findRequestsByBank(bloodBankId, status) {
  const params = [bloodBankId];
  let query = `
    SELECT br.*, u.name AS requester_name, u.phone AS requester_phone
    FROM blood_requests br
    JOIN users u ON br.requester_id = u.id
    WHERE br.blood_bank_id = ?
  `;
  if (status) {
    query += " AND br.status = ? ";
    params.push(status);
  }
  query += " ORDER BY br.created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows;
}

async function assignBank(requestId, bloodBankId) {
  const [result] = await pool.query(
    `UPDATE blood_requests SET blood_bank_id = ?
     WHERE id = ? AND blood_bank_id IS NULL`,
    [bloodBankId, requestId]
  );
  return result.affectedRows > 0;
}

async function updateStatus(requestId, status, conn = pool) {
  await conn.query("UPDATE blood_requests SET status = ? WHERE id = ?", [status, requestId]);
}

module.exports = {
  createRequest,
  findRequestById,
  findRequestsByRequester,
  findRequestsByBank,
  assignBank,
  updateStatus,
};