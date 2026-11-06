const K = 24;

export function expectedScore(player: number, opponent: number) {
  return 1 / (1 + 10 ** ((opponent - player) / 400));
}

/**
 * Rating baru setelah percobaan pertama (PZ-09).
 * Berhasil dengan petunjuk tidak mengubah rating.
 */
export function nextRating(player: number, puzzle: number, solved: boolean, usedHint: boolean) {
  if (solved && usedHint) return player;
  const delta = K * ((solved ? 1 : 0) - expectedScore(player, puzzle));
  return Math.max(100, Math.round(player + delta));
}
