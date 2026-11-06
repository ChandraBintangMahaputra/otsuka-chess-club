import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StaticBoard } from "@/components/chess/static-board";
import { parseContent } from "@/lib/board-directive";

export function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-chess">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

/** Markdown materi dengan papan dari sintaks `::board{...}` (BD-02). */
export function LessonContent({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-6">
      {parseContent(markdown).map((block, i) =>
        block.type === "md" ? (
          <Markdown key={i} text={block.text} />
        ) : (
          <figure key={i} className="max-w-sm">
            <StaticBoard
              fen={block.board.fen}
              arrows={block.board.arrows}
              highlight={block.board.highlight}
              label={block.board.caption ?? "Papan contoh"}
            />
            {block.board.caption && (
              <figcaption className="mt-2 text-sm text-muted">{block.board.caption}</figcaption>
            )}
          </figure>
        ),
      )}
    </div>
  );
}
