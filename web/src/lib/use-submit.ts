"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React mengosongkan form setelah `<form action>` selesai, sehingga isian hilang
 * saat validasi gagal. Mengirim lewat onSubmit menjaga isian tetap ada.
 */
export function useSubmit(action: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  };
}
