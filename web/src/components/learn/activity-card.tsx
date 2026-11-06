import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatTanggal } from "@/lib/date";
import { CATEGORY_LABEL, type Activity } from "@/lib/types";

export function ActivityCard({ activity: a }: { activity: Activity }) {
  return (
    <Link
      href={`/dokumentasi/${a.slug}`}
      className="group block overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-150 hover:border-forest"
    >
      <div className="relative aspect-[16/9] bg-line">
        {a.cover_path && (
          <Image
            src={a.cover_path}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <Badge tone="forest">{CATEGORY_LABEL[a.category]}</Badge>
        <h3 className="mt-2 text-lg group-hover:text-forest">{a.title}</h3>
        <p className="mt-1 text-sm text-muted">{formatTanggal(a.held_on)}</p>
      </div>
    </Link>
  );
}
