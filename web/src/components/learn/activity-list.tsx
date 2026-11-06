"use client";

import { useMemo, useState } from "react";
import { ActivityCard } from "@/components/learn/activity-card";
import { Field, Select } from "@/components/ui";
import { CATEGORY_LABEL, type Activity } from "@/lib/types";

export function ActivityList({ activities }: { activities: Activity[] }) {
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");

  const years = useMemo(() => [...new Set(activities.map((a) => a.held_on.slice(0, 4)))], [activities]);
  const shown = activities.filter(
    (a) => (!category || a.category === category) && (!year || a.held_on.startsWith(year)),
  );

  return (
    <div>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <Field label="Kategori" name="kategori">
          <Select id="kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Semua</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tahun" name="tahun">
          <Select id="tahun" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Semua</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-line bg-surface p-6 text-muted">
          Belum ada kegiatan untuk filter ini.
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <li key={a.id}>
              <ActivityCard activity={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
