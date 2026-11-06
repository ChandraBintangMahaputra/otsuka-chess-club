"use client";

import Swal from "sweetalert2";

const COLORS = { confirmButtonColor: "#1f4d3f", cancelButtonColor: "#55625c" };

export function toastSuccess(title: string) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });
}

export function alertError(text: string) {
  return Swal.fire({ icon: "error", title: "Gagal", text, ...COLORS, confirmButtonText: "Tutup" });
}

export async function confirmAction(title: string, text: string, confirmButtonText: string) {
  const r = await Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Batal",
    reverseButtons: true,
    ...COLORS,
  });
  return r.isConfirmed;
}

export async function confirmDelete(text = "Tindakan ini tidak bisa dibatalkan.") {
  const r = await Swal.fire({
    icon: "warning",
    title: "Hapus data ini?",
    text,
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    confirmButtonColor: "#b42318",
    cancelButtonColor: COLORS.cancelButtonColor,
    reverseButtons: true,
  });
  return r.isConfirmed;
}

export function showTemporaryPassword(password: string) {
  return Swal.fire({
    icon: "success",
    title: "Password sementara",
    html: "Berikan kepada anggota. Password ini hanya tampil sekali.",
    input: "text",
    inputValue: password,
    inputAttributes: { readonly: "true", "aria-label": "Password sementara" },
    confirmButtonText: "Tutup",
    ...COLORS,
  });
}
