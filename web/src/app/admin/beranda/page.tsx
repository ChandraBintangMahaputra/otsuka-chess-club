import Link from "next/link";
import { saveSiteSettingsAction } from "@/actions/admin-site";
import { AdminForm } from "@/components/admin/forms";
import { Badge, buttonClass, Card, Field, Input, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { LANDING_SECTIONS, type LandingItem, type LandingSection } from "@/lib/site-content";
import { getSiteSettings } from "@/lib/site-queries";

function TextField({
  name,
  label,
  value,
  help,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string | number | null;
  help?: string;
  placeholder: string;
}) {
  return (
    <Field label={label} name={name} help={help}>
      <Input id={name} name={name} defaultValue={value ?? ""} placeholder={placeholder} />
    </Field>
  );
}

function LongField({
  name,
  label,
  value,
  rows = 3,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  rows?: number;
  placeholder: string;
}) {
  return (
    <Field label={label} name={name}>
      <Textarea id={name} name={name} rows={rows} defaultValue={value} placeholder={placeholder} className="font-sans text-base" />
    </Field>
  );
}

function HeadingFields({ name, label, value }: { name: string; label: string; value: { eyebrow: string; title: string } }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField name={`${name}.eyebrow`} label={`${label}: label kecil`} value={value.eyebrow} placeholder="Mis. Agenda" />
      <TextField name={`${name}.title`} label={`${label}: judul`} value={value.title} placeholder="Judul bagian" />
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-4 rounded-xl border border-line bg-surface p-4">
      <legend className="px-1 font-display text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export default async function AdminBerandaPage() {
  await requireAdmin();
  const [s, rows] = await Promise.all([
    getSiteSettings(),
    sql`select id, section, title, body, href, position, is_published from landing_items order by position, title`,
  ]);
  const items = rows as unknown as LandingItem[];

  return (
    <>
      <h1 className="text-3xl">Isi beranda</h1>
      <p className="mt-1 text-muted">Perubahan langsung tampil di beranda setelah disimpan.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(Object.keys(LANDING_SECTIONS) as LandingSection[]).map((section) => (
          <Card key={section} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl">{LANDING_SECTIONS[section]}</h2>
              <Link href={`/admin/beranda/baru?section=${section}`} className={buttonClass("primary", "sm")}>
                Tambah
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {items.filter((i) => i.section === section).length === 0 && (
                <li className="py-2 text-sm text-muted">Belum ada item. Bagian ini tidak tampil.</li>
              )}
              {items
                .filter((i) => i.section === section)
                .map((i) => (
                  <li key={i.id}>
                    <Link href={`/admin/beranda/${i.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-forest">
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {i.position}. {i.title}
                      </span>
                      {!i.is_published && <Badge>Draf</Badge>}
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        Kartu di beranda diambil otomatis dari{" "}
        <Link href="/admin/kegiatan" className="font-semibold text-forest underline">
          Kegiatan
        </Link>
        ,{" "}
        <Link href="/admin/artikel" className="font-semibold text-forest underline">
          Artikel
        </Link>
        , dan{" "}
        <Link href="/admin/dokumentasi" className="font-semibold text-forest underline">
          Dokumentasi
        </Link>
        .
      </p>

      <div className="mt-8 max-w-3xl">
        <AdminForm action={saveSiteSettingsAction}>
          <Group title="Hero">
            <TextField name="hero.eyebrow" placeholder="Mis. Klub catur karyawan" label="Label kecil" value={s.hero.eyebrow} />
            <TextField name="hero.title" placeholder="Kalimat utama beranda" label="Judul" value={s.hero.title} />
            <LongField name="hero.tagline" placeholder="Satu atau dua kalimat di bawah judul" label="Tagline" value={s.hero.tagline} />
            <TextField name="hero.boardFen" placeholder="Mis. 6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1" label="Posisi papan (FEN)" value={s.hero.boardFen} />
            <TextField name="hero.boardHighlight" placeholder="Mis. d8 e8" label="Petak disorot" value={s.hero.boardHighlight} help="Dipisah spasi, mis. d8 e8" />
            <TextField name="hero.boardCaption" placeholder="Keterangan singkat di bawah papan" label="Keterangan papan" value={s.hero.boardCaption} />
          </Group>
          <Group title="Tentang klub">
            <HeadingFields name="about" label="Bagian" value={s.about} />
            <LongField name="about.body" placeholder="Ceritakan klub secara singkat" label="Isi" value={s.about.body} rows={5} />
            <LongField name="about.vision" placeholder="Tulis visi klub" label="Visi" value={s.about.vision} rows={2} />
            <TextField name="about.memberCount" placeholder="Mis. 25" label="Jumlah anggota" value={s.about.memberCount} help="Kosongkan untuk menyembunyikan." />
          </Group>
          <Group title="Judul bagian">
            <HeadingFields name="sections.kegiatan" label="Kegiatan" value={s.sections.kegiatan} />
            <HeadingFields name="sections.artikel" label="Artikel" value={s.sections.artikel} />
            <HeadingFields name="sections.dokumentasi" label="Dokumentasi" value={s.sections.dokumentasi} />
            <HeadingFields name="sections.belajar" label="Mulai belajar" value={s.sections.belajar} />
            <HeadingFields name="sections.puzzle" label="Puzzle harian" value={s.sections.puzzle} />
            <TextField name="sections.puzzle.body" placeholder="Kalimat ajakan mencoba puzzle" label="Puzzle harian: keterangan" value={s.sections.puzzle.body} />
            <HeadingFields name="sections.faq" label="Tanya jawab" value={s.sections.faq} />
          </Group>
          <Group title="Footer">
            <TextField name="footer.text" placeholder="Mis. Otsuka Chess, klub catur karyawan." label="Teks" value={s.footer.text} />
            <TextField name="footer.contactLabel" placeholder="Mis. Gabung grup WhatsApp" label="Teks kontak" value={s.footer.contactLabel} />
            <TextField
              name="footer.contactHref" placeholder="Mis. https://chat.whatsapp.com/kode-grup"
              label="Tautan kontak"
              value={s.footer.contactHref}
              help="Awali dengan https:// atau mailto:. Kosongkan bila belum ada."
            />
          </Group>
        </AdminForm>
      </div>
    </>
  );
}
