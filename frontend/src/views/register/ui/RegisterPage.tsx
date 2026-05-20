import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register/ui/RegisterForm";
import { AuthScreenLayout } from "@/shared/ui/auth-screen/AuthScreenLayout";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создание аккаунта Petto",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return (
    <AuthScreenLayout>
      <RegisterForm />
    </AuthScreenLayout>
  );
}
