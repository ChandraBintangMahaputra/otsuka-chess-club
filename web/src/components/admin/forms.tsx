"use client";

import { useActionState, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import {
  deleteContentAction,
  resetPasswordAction,
  setActiveAction,
  setRoleAction,
  type AdminState,
} from "@/actions/admin";
import { StaticBoard } from "@/components/chess/static-board";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { alertError, confirmAction, confirmDelete, showTemporaryPassword, toastSuccess } from "@/lib/swal";
import { useSubmit } from "@/lib/use-submit";

type Action = (state: AdminState, form: FormData) => Promise<AdminState>;

export function AdminForm({
  action,
  submit = "Simpan",
  children,
}: {
  action: Action;
  submit?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const onSubmit = useSubmit(formAction);

  useEffect(() => {
    if (state?.error) alertError(state.error);
    if (state?.success) {
      toastSuccess(state.success);
      if (state.redirectTo) router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : submit}
      </Button>
    </form>
  );
}

/** Tombol hapus dengan konfirmasi SweetAlert. */
export function ConfirmDeleteButton({
  onDelete,
  redirectTo,
  text,
}: {
  onDelete: () => Promise<void>;
  redirectTo?: string;
  text?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={async () => {
        if (!(await confirmDelete(text))) return;
        start(async () => {
          try {
            await onDelete();
            toastSuccess("Data terhapus.");
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch {
            alertError("Gagal menghapus. Coba lagi.");
          }
        });
      }}
    >
      {pending ? "Menghapus…" : "Hapus"}
    </Button>
  );
}

const DELETE_TARGET = {
  lesson: "/admin/materi",
  opening: "/admin/opening",
  activity: "/admin/dokumentasi",
  puzzle: "/admin/puzzle",
} as const;

export function DeleteButton({ kind, id }: { kind: keyof typeof DELETE_TARGET; id: string }) {
  return <ConfirmDeleteButton onDelete={() => deleteContentAction(kind, id)} redirectTo={DELETE_TARGET[kind]} />;
}

function validFen(fen: string) {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

/** AD-05: pratinjau papan langsung saat mengisi FEN. */
export function FenField({ defaultValue = "" }: { defaultValue?: string }) {
  const [fen, setFen] = useState(defaultValue);
  const ok = validFen(fen);
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
      <Field label="FEN" name="fen" error={fen && !ok ? "FEN tidak valid" : undefined}>
        <Input id="fen" name="fen" required placeholder="Mis. r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3" value={fen} onChange={(e) => setFen(e.target.value)} />
      </Field>
      {ok && <StaticBoard fen={fen} coordinates={false} label="Pratinjau posisi" />}
    </div>
  );
}

/** AD-05: pratinjau posisi akhir saat mengisi PGN. */
export function PgnField({
  name = "pgn",
  label = "PGN",
  defaultValue = "",
  required,
}: {
  name?: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [pgn, setPgn] = useState(defaultValue);
  const fen = useMemo(() => {
    if (!pgn.trim()) return null;
    try {
      const game = new Chess();
      game.loadPgn(pgn);
      return game.fen();
    } catch {
      return "invalid";
    }
  }, [pgn]);

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
      <Field label={label} name={name} error={fen === "invalid" ? "PGN tidak valid" : undefined}>
        <Textarea id={name} name={name} rows={5} required={required} placeholder="Mis. 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5" value={pgn} onChange={(e) => setPgn(e.target.value)} />
      </Field>
      {fen && fen !== "invalid" && <StaticBoard fen={fen} coordinates={false} label="Pratinjau posisi akhir" />}
    </div>
  );
}

export function MemberActions({
  userId,
  name,
  role,
  isActive,
}: {
  userId: string;
  name: string;
  role: "member" | "admin";
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function run(title: string, text: string, confirm: string, work: () => Promise<unknown>, done: string) {
    if (!(await confirmAction(title, text, confirm))) return;
    start(async () => {
      try {
        await work();
        toastSuccess(done);
        router.refresh();
      } catch {
        alertError("Gagal menyimpan. Coba lagi.");
      }
    });
  }

  const nextRole = role === "admin" ? "member" : "admin";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(
            role === "admin" ? "Cabut peran admin?" : "Jadikan admin?",
            name,
            "Ya, ubah",
            () => setRoleAction(userId, nextRole),
            "Peran diubah.",
          )
        }
      >
        {role === "admin" ? "Jadikan anggota" : "Jadikan admin"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(
            isActive ? "Nonaktifkan akun?" : "Aktifkan akun?",
            name,
            isActive ? "Ya, nonaktifkan" : "Ya, aktifkan",
            () => setActiveAction(userId, !isActive),
            "Status akun diubah.",
          )
        }
      >
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={async () => {
          if (!(await confirmAction("Reset password?", name, "Ya, reset"))) return;
          start(async () => {
            try {
              await showTemporaryPassword(await resetPasswordAction(userId));
            } catch {
              alertError("Gagal mereset password.");
            }
          });
        }}
      >
        Reset password
      </Button>
    </div>
  );
}
