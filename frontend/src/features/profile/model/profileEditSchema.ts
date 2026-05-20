import { z } from "zod";

export const profileEditSchema = z
  .object({
    name: z.string().min(1, "Логин обязателен"),
    email: z.string().min(1, "Email обязателен").email("Неверный формат email"),
    oldPassword: z.string(),
    newPassword: z.string(),
  })
  .superRefine((val, ctx) => {
    const newP = val.newPassword.trim();
    const oldP = val.oldPassword.trim();
    if (newP) {
      if (!oldP) {
        ctx.addIssue({
          code: "custom",
          message: "Для смены пароля необходимо ввести старый пароль",
          path: ["oldPassword"],
        });
      }
      if (newP.length < 6) {
        ctx.addIssue({
          code: "custom",
          message: "Новый пароль должен быть не менее 6 символов",
          path: ["newPassword"],
        });
      }
    }
    if (oldP && !newP) {
      ctx.addIssue({
        code: "custom",
        message: "Необходимо указать новый пароль",
        path: ["newPassword"],
      });
    }
  });

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
