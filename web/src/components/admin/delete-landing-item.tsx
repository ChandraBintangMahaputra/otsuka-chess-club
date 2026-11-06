"use client";

import { deleteLandingItemAction } from "@/actions/admin-site";
import { ConfirmDeleteButton } from "./forms";

export function DeleteLandingItem({ id }: { id: string }) {
  return <ConfirmDeleteButton onDelete={() => deleteLandingItemAction(id)} redirectTo="/admin/beranda" />;
}
