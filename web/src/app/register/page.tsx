import type { Metadata } from "next";
import { RegisterForm } from "@/components/site/auth-forms";
import { Card, Container } from "@/components/ui";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <Container className="max-w-md py-10">
      <h1 className="text-3xl">Gabung klub</h1>
      <p className="mt-1 text-muted">Buat akun agar progres dan rating puzzle tersimpan.</p>
      <Card className="mt-6 p-5">
        <RegisterForm />
      </Card>
    </Container>
  );
}
