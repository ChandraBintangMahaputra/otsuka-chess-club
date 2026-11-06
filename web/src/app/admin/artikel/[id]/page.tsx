import { PostAdminForm } from "@/components/admin/post-admin";

export default async function EditArtikelPage({ params }: PageProps<"/admin/artikel/[id]">) {
  return <PostAdminForm type="artikel" id={(await params).id} />;
}
