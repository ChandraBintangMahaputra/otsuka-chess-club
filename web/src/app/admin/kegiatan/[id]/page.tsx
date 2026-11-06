import { PostAdminForm } from "@/components/admin/post-admin";

export default async function EditKegiatanPage({ params }: PageProps<"/admin/kegiatan/[id]">) {
  return <PostAdminForm type="kegiatan" id={(await params).id} />;
}
