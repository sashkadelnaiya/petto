"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { User } from "@/entities/user/model/types";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/model/authSchemas";
import { bffFetch } from "@/shared/api/bff-client";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import {
  isBffError,
  parseBffJson,
} from "@/shared/lib/parseBffJson";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "./LoginForm.module.css";

type LoginSuccess = { success: true; data: { user: User } };

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showError, showSuccess } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const res = await bffFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    const body = await parseBffJson<LoginSuccess["data"]>(res);

    if (!res.ok || isBffError(body)) {
      showError(getServerErrorMessage(body.success === false ? body.code : undefined));
      return;
    }

    setUser(body.data.user);
    showSuccess("Вход выполнен");
    router.push("/");
    router.refresh();
  };

  return (
    <article className={styles.card} aria-labelledby="login-title">
      <h1 id="login-title" className={styles.title}>
        Вход
      </h1>
      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className={styles.field}>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-err" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <span id="login-email-err" className={styles.fieldError} role="alert">
              {errors.email.message}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            placeholder="Пароль"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-err" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <span
              id="login-password-err"
              className={styles.fieldError}
              role="alert"
            >
              {errors.password.message}
            </span>
          ) : null}
        </div>

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Вход…" : "Войти"}
        </button>
      </form>

      <div className={styles.divider}>
        <span className={styles.dividerLine} aria-hidden />
        <span className={styles.dividerText}>или</span>
        <span className={styles.dividerLine} aria-hidden />
      </div>

      <Link className={styles.secondaryCta} href="/register">
        Создать аккаунт
      </Link>
    </article>
  );
}
