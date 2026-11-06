import type { Metadata } from "next";
import { LoginForm } from "@/components/site/auth-forms";
import { Card, Container } from "@/components/ui";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <Container className="max-w-md py-10">
      <h1 className="text-3xl">Masuk</h1>
      <p className="mt-1 text-muted">Lanjutkan progres belajarmu.</p>
      <Card className="mt-6 p-5">
        <LoginForm next={safeNext(next)} />
      </Card>
    </Container>
  );
}
