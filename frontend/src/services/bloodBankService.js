// src/services/bloodBankService.js

import api from "./api";

export async function registerBloodBank(data) {
  const res = await api.post("/blood-banks/register", data);
  return res.data;
}

export async function fetchMyBloodBankProfile() {
  const res = await api.get("/blood-banks/me");
  return res.data;
}

export async function listBloodBanks() {
  const res = await api.get("/blood-banks");
  return res.data;
}

export async function uploadBloodBankImages({ files, file, imageType, caption }) {
  const formData = new FormData();
  const fileList = files && files.length ? files : (file ? [file] : []);
  for (const f of fileList) {
    formData.append("images", f);
  }
  if (imageType) formData.append("imageType", imageType);
  if (caption) formData.append("caption", caption);

  const res = await api.post("/blood-banks/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const uploadBloodBankImage = uploadBloodBankImages;

export async function fetchMyBloodBankImages() {
  const res = await api.get("/blood-banks/me/images");
  return res.data;
}

export async function deleteBloodBankImage(imageId) {
  const res = await api.delete(`/blood-banks/images/${imageId}`);
  return res.data;
}

export async function fetchPublicBloodBankImages(bankId) {
  const res = await api.get(`/blood-banks/${bankId}/images`);
  return res.data;
}