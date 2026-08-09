// src/controllers/inventoryController.js

const inventoryModel = require("../models/inventoryModel");
const bloodBankModel = require("../models/bloodBankModel");
const { VALID_BLOOD_GROUPS } = require("../utils/constants");

/**
 * Helper: resolves the logged-in blood-bank user's own blood_banks.id.
 * Every write route below uses this rather than trusting a bloodBankId
 * from the request body — a bank should only ever be able to modify
 * ITS OWN inventory, never another bank's, no matter what id is passed in.
 */
async function resolveOwnBankId(req) {
  const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  return bank ? bank.id : null;
}

/**
 * POST /api/inventory
 * PROTECTED, blood_bank only. Adds a new stock batch for the logged-in bank.
 */
async function addBatch(req, res) {
  const { bloodGroup, quantityUnits, collectionDate, expiryDate } = req.body;

  if (!bloodGroup || quantityUnits == null) {
    return res.status(400).json({
      success: false,
      message: "bloodGroup and quantityUnits are required.",
    });
  }
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ success: false, message: "Invalid blood group." });
  }
  if (quantityUnits < 0) {
    return res.status(400).json({ success: false, message: "quantityUnits cannot be negative." });
  }

  const bloodBankId = await resolveOwnBankId(req);
  if (!bloodBankId) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }

  const batchId = await inventoryModel.createBatch({
    bloodBankId, bloodGroup, quantityUnits, collectionDate, expiryDate,
  });

  res.status(201).json({
    success: true,
    message: "Inventory batch added.",
    batch: { id: batchId, bloodGroup, quantityUnits, collectionDate, expiryDate },
  });
}

/**
 * GET /api/inventory/me
 * PROTECTED, blood_bank only. Lists all batches belonging to the logged-in bank.
 */
async function getMyInventory(req, res) {
  const bloodBankId = await resolveOwnBankId(req);
  if (!bloodBankId) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }
  const batches = await inventoryModel.findBatchesByBankId(bloodBankId);
  res.status(200).json({ success: true, batches });
}

/**
 * PUT /api/inventory/:id
 * PROTECTED, blood_bank only. Updates a batch's quantity — e.g. after a
 * donation adds stock, or a fulfilled request deducts it.
 * Ownership check: refuses to update a batch that doesn't belong to
 * the logged-in bank, even if the id exists in the table.
 */
async function updateBatch(req, res) {
  const { id } = req.params;
  const { quantityUnits } = req.body;

  if (quantityUnits == null || quantityUnits < 0) {
    return res.status(400).json({ success: false, message: "A valid, non-negative quantityUnits is required." });
  }

  const batch = await inventoryModel.findBatchById(id);
  if (!batch) {
    return res.status(404).json({ success: false, message: "Inventory batch not found." });
  }

  const bloodBankId = await resolveOwnBankId(req);
  if (batch.blood_bank_id !== bloodBankId) {
    return res.status(403).json({ success: false, message: "You can only update your own bank's inventory." });
  }

  await inventoryModel.updateBatchQuantity(id, quantityUnits);
  res.status(200).json({ success: true, message: "Batch updated.", batchId: Number(id), quantityUnits });
}

/**
 * DELETE /api/inventory/:id
 * PROTECTED, blood_bank only. Same ownership check as updateBatch.
 */
async function removeBatch(req, res) {
  const { id } = req.params;

  const batch = await inventoryModel.findBatchById(id);
  if (!batch) {
    return res.status(404).json({ success: false, message: "Inventory batch not found." });
  }

  const bloodBankId = await resolveOwnBankId(req);
  if (batch.blood_bank_id !== bloodBankId) {
    return res.status(403).json({ success: false, message: "You can only delete your own bank's inventory." });
  }

  await inventoryModel.deleteBatch(id);
  res.status(200).json({ success: true, message: "Batch deleted." });
}

/**
 * GET /api/inventory/search?bloodGroup=O+&city=Kathmandu
 * PUBLIC. Used by users searching for blood availability. `city` is
 * optional — omitting it searches across all cities.
 */
async function searchAvailability(req, res) {
  const { bloodGroup, city } = req.query;

  if (!bloodGroup) {
    return res.status(400).json({ success: false, message: "bloodGroup query parameter is required." });
  }
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ success: false, message: "Invalid blood group." });
  }

  const results = await inventoryModel.searchAvailability({ bloodGroup, city });
  res.status(200).json({ success: true, count: results.length, results });
}

module.exports = { addBatch, getMyInventory, updateBatch, removeBatch, searchAvailability };