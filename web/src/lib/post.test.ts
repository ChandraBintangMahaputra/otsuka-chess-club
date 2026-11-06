import { describe, expect, it } from "vitest";
import { detectImageMime, isImagePath, postSchema } from "./post";

const base = {
  type: "kegiatan",
  title: "Turnamen Agustus!",
  slug: "",
  excerpt: "",
  body_md: "Isi",
  cover_path: "",
  published_on: "2026-11-06",
};

describe("postSchema", () => {
  it("membuat slug dari judul bila kosong", () => {
    expect(postSchema.parse(base).slug).toBe("turnamen-agustus");
    expect(postSchema.parse({ ...base, slug: "Slug Khusus" }).slug).toBe("slug-khusus");
  });
  it("menolak isi kosong, tipe asing, dan sampul dari luar", () => {
    expect(postSchema.safeParse({ ...base, body_md: " " }).success).toBe(false);
    expect(postSchema.safeParse({ ...base, type: "lain" }).success).toBe(false);
    expect(postSchema.safeParse({ ...base, cover_path: "https://evil.com/a.png" }).success).toBe(false);
  });
});

describe("isImagePath", () => {
  it("hanya menerima path internal gambar", () => {
    expect(isImagePath("/media/8e1ae4f9-5f4d-4fb1-9c84-091abd31a122")).toBe(true);
    expect(isImagePath("/dokumentasi/turnamen/01.webp")).toBe(true);
    expect(isImagePath("/dokumentasi/../secret")).toBe(false);
    expect(isImagePath("//evil.com/a.png")).toBe(false);
    expect(isImagePath("javascript:alert(1)")).toBe(false);
  });
});

describe("detectImageMime", () => {
  const bytes = (...v: number[]) => new Uint8Array(v);
  const text = (s: string) => new TextEncoder().encode(s);
  it("mengenali gambar dari isi file", () => {
    expect(detectImageMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageMime(bytes(0x89, 0x50, 0x4e, 0x47))).toBe("image/png");
    expect(detectImageMime(text("RIFF....WEBPVP8 "))).toBe("image/webp");
  });
  it("menolak file lain walau dinamai gambar", () => {
    expect(detectImageMime(text("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageMime(text("<html></html>"))).toBeNull();
  });
});
