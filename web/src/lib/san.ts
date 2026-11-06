/** Membuang tanda skak dan mat agar jawaban latihan tidak perlu menyebutkannya. */
export const normalizeSan = (san: string) => san.replace(/[+#]/g, "");
