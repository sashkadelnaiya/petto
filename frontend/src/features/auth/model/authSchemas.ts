import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email обязателен")
    .email("Неверный формат email"),
  password: z
    .string()
    .min(6, "Пароль минимум 6 символов"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Имя минимум 2 символа")
      .max(50, "Максимум 50 символов"),
    email: z
      .string()
      .min(1, "Email обязателен")
      .email("Неверный формат email"),
    password: z
      .string()
      .min(1, "Пароль обязателен")
      .min(6, "Пароль минимум 6 символов")
      .max(50, "Пароль максимум 50 символов"),
    confirmPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
