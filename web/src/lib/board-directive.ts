export type BoardBlock = { fen: string; arrows: string[]; highlight: string[]; caption?: string };
export type ContentBlock = { type: "md"; text: string } | { type: "board"; board: BoardBlock };

const DIRECTIVE = /^::board\{(.*)\}\s*$/;
const ATTR = /(\w+)="([^"]*)"/g;

function parseAttrs(raw: string) {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(ATTR)) attrs[m[1]] = m[2];
  return attrs;
}

const list = (v?: string) => (v ? v.split(/[\s,]+/).filter(Boolean) : []);

/** Memecah Markdown menjadi teks dan papan dari sintaks `::board{fen="..." arrows="e2e4"}` (BD-02). */
export function parseContent(md: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ type: "md", text });
    buffer = [];
  };

  for (const line of md.split(/\r?\n/)) {
    const match = line.trim().match(DIRECTIVE);
    const attrs = match ? parseAttrs(match[1]) : null;
    if (!attrs?.fen) {
      buffer.push(line);
      continue;
    }
    flush();
    blocks.push({
      type: "board",
      board: {
        fen: attrs.fen,
        arrows: list(attrs.arrows),
        highlight: list(attrs.highlight),
        caption: attrs.caption,
      },
    });
  }
  flush();
  return blocks;
}
