"use client";

import { deletePostAction } from "@/actions/admin-posts";
import { POST_TYPES, type PostType } from "@/lib/post";
import { ConfirmDeleteButton } from "./forms";

export function DeletePost({ type, id }: { type: PostType; id: string }) {
  return <ConfirmDeleteButton onDelete={() => deletePostAction(type, id)} redirectTo={POST_TYPES[type].admin} />;
}
