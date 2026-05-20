import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login/ui/LoginForm";
import { AuthScreenLayout } from "@/shared/ui/auth-screen/AuthScreenLayout";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в аккаунт Petto",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <AuthScreenLayout>
      <LoginForm />
    </AuthScreenLayout>
  );
}
