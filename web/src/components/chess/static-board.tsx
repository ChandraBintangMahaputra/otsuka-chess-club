import { cn } from "@/components/ui";

const FILES = "abcdefgh";

function squareCenter(square: string, flipped: boolean) {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return flipped ? { x: 7.5 - file, y: rank + 0.5 } : { x: file + 0.5, y: 7.5 - rank };
}

function parseFen(fen: string) {
  return fen
    .split(" ")[0]
    .split("/")
    .map((row) => {
      const cells: (string | null)[] = [];
      for (const ch of row) {
        if (/\d/.test(ch)) cells.push(...Array<null>(Number(ch)).fill(null));
        else cells.push(ch);
      }
      return cells;
    });
}

const pieceFile = (p: string) => `${p === p.toUpperCase() ? "w" : "b"}${p.toUpperCase()}`;

/**
 * Papan tanpa JavaScript untuk contoh materi, kartu opening, dan landing.
 * Papan interaktif ada di chess-board.tsx dan hanya dimuat di halaman yang butuh.
 */
export function StaticBoard({
  fen,
  arrows = [],
  highlight = [],
  flipped = false,
  coordinates = true,
  label,
  className,
}: {
  fen: string;
  arrows?: string[];
  highlight?: string[];
  flipped?: boolean;
  coordinates?: boolean;
  label: string;
  className?: string;
}) {
  const rows = parseFen(fen);
  const order = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative aspect-square w-full overflow-hidden rounded-lg", className)}
    >
      <div className="grid size-full grid-cols-8 grid-rows-8">
        {order.flatMap((r) =>
          order.map((c) => {
            const row = flipped ? 7 - r : r;
            const col = flipped ? 7 - c : c;
            const piece = rows[row]?.[col];
            const square = `${FILES[col]}${8 - row}`;
            const light = (row + col) % 2 === 0;
            return (
              <div
                key={square}
                className="relative"
                style={{ background: light ? "var(--sq-light)" : "var(--sq-dark)" }}
              >
                {highlight.includes(square) && <div className="absolute inset-0 bg-[#e8b93a]/60" />}
                {coordinates && c === 0 && (
                  <span
                    className="absolute left-0.5 top-0 text-[9px] font-semibold leading-tight sm:text-[10px]"
                    style={{ color: light ? "var(--sq-dark)" : "var(--sq-light)" }}
                  >
                    {8 - row}
                  </span>
                )}
                {coordinates && r === 7 && (
                  <span
                    className="absolute bottom-0 right-0.5 text-[9px] font-semibold leading-tight sm:text-[10px]"
                    style={{ color: light ? "var(--sq-dark)" : "var(--sq-light)" }}
                  >
                    {FILES[col]}
                  </span>
                )}
                {piece && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/pieces/${pieceFile(piece)}.svg`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full"
                  />
                )}
              </div>
            );
          }),
        )}
      </div>

      {arrows.length > 0 && (
        <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
          <defs>
            <marker id="arrow-head" markerWidth="3.2" markerHeight="3.2" refX="1.6" refY="1.6" orient="auto">
              <path d="M0,0 L3.2,1.6 L0,3.2 Z" fill="#a84c1a" />
            </marker>
          </defs>
          {arrows.map((a) => {
            const from = squareCenter(a.slice(0, 2), flipped);
            const to = squareCenter(a.slice(2, 4), flipped);
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.hypot(dx, dy) || 1;
            const shorten = 0.42;
            return (
              <line
                key={a}
                x1={from.x}
                y1={from.y}
                x2={to.x - (dx / len) * shorten}
                y2={to.y - (dy / len) * shorten}
                stroke="#a84c1a"
                strokeWidth="0.14"
                strokeLinecap="round"
                opacity="0.88"
                markerEnd="url(#arrow-head)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
