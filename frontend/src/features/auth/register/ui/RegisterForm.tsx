"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/model/authSchemas";
import { bffFetch } from "@/shared/api/bff-client";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import {
  isBffError,
  parseBffJson,
} from "@/shared/lib/parseBffJson";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "./RegisterForm.module.css";

type RegisterSuccess = {
  success: true;
  data: { user: { id: number; email: string; name: string } };
};

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showError, showSuccess } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    const res = await bffFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    const body = await parseBffJson<RegisterSuccess["data"]>(res);

    if (!res.ok || isBffError(body)) {
      showError(getServerErrorMessage(body.success === false ? body.code : undefined));
      return;
    }

    setUser(body.data.user);
    showSuccess("Регистрация успешна");
    router.push("/");
    router.refresh();
  };

  return (
    <article className={styles.card} aria-labelledby="register-title">
      <h1 id="register-title" className={styles.title}>
        Регистрация
      </h1>
      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className={styles.field}>
          <input
            className={styles.input}
            type="text"
            autoComplete="username"
            placeholder="Введите логин"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "reg-name-err" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <span id="reg-name-err" className={styles.fieldError} role="alert">
              {errors.name.message}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reg-email-err" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <span id="reg-email-err" className={styles.fieldError} role="alert">
              {errors.email.message}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            autoComplete="new-password"
            placeholder="Пароль"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "reg-password-err" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <span id="reg-password-err" className={styles.fieldError} role="alert">
              {errors.password.message}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            autoComplete="new-password"
            placeholder="Повторите пароль"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "reg-confirm-err" : undefined
            }
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <span id="reg-confirm-err" className={styles.fieldError} role="alert">
              {errors.confirmPassword.message}
            </span>
          ) : null}
        </div>

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Регистрация…" : "Зарегистрироваться"}
        </button>
      </form>

      <p className={styles.footer}>
        Уже есть аккаунт?{" "}
        <Link className={styles.footerLink} href="/login">
          Войти
        </Link>
      </p>
    </article>
  );
}
