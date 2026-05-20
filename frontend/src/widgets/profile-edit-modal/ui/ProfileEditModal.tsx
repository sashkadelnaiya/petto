"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import type { User } from "@/entities/user/model/types";
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from "@/features/profile/model/profileEditSchema";
import { bffFetch } from "@/shared/api/bff-client";
import avatar1 from "@/shared/assets/avatar.png";
import avatar2 from "@/shared/assets/avatar@2x.png";
import avatar3 from "@/shared/assets/avatar@3x.png";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { absoluteUploadUrl } from "@/shared/lib/mediaUrl";
import {
  isBffError,
  parseBffJson,
} from "@/shared/lib/parseBffJson";
import { Modal } from "@/shared/ui/modal/Modal";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "./ProfileEditModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaved?: () => void | Promise<void>;
};

export function ProfileEditModal({ open, onClose, user, onSaved }: Props) {
  const { showError, showSuccess } = useToast();
  const fileId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarToDelete, setAvatarToDelete] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: "",
      email: "",
      oldPassword: "",
      newPassword: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const loadForm = useCallback(() => {
    if (!user) return;
    reset({
      name: user.name || "",
      email: user.email || "",
      oldPassword: "",
      newPassword: "",
    });
    setSelectedFile(null);
    setAvatarToDelete(false);
  }, [user, reset]);

  useEffect(() => {
    if (open && user) loadForm();
  }, [open, user, loadForm]);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    setSelectedFile(f);
    setAvatarToDelete(false);
  };

  const onRemoveAvatar = () => {
    if (
      !window.confirm(
        "Удалить аватар? Вы уверены, что хотите удалить аватар?",
      )
    ) {
      return;
    }
    setSelectedFile(null);
    setAvatarToDelete(true);
  };

  const onSubmit = async (data: ProfileEditFormValues) => {
    if (!user) return;
    try {
      const updatePayload: { name?: string; email?: string } = {};
      if (data.name.trim() !== user.name) updatePayload.name = data.name.trim();
      if (data.email.trim() !== user.email)
        updatePayload.email = data.email.trim();

      if (Object.keys(updatePayload).length > 0) {
        const res = await bffFetch("/api/me", {
          method: "PUT",
          body: JSON.stringify(updatePayload),
        });
        const body = await parseBffJson<unknown>(res);
        if (!res.ok || isBffError(body)) {
          showError(
            getServerErrorMessage(
              body.success === false ? body.code : undefined,
            ),
          );
          return;
        }
      }

      const newP = data.newPassword.trim();
      const oldP = data.oldPassword.trim();
      if (newP) {
        const res = await bffFetch("/api/me/password", {
          method: "PUT",
          body: JSON.stringify({
            oldPassword: oldP,
            newPassword: newP,
          }),
        });
        const body = await parseBffJson<unknown>(res);
        if (!res.ok || isBffError(body)) {
          showError(
            getServerErrorMessage(
              body.success === false ? body.code : undefined,
            ),
          );
          return;
        }
      }

      if (avatarToDelete) {
        const res = await bffFetch("/api/me/avatar", { method: "DELETE" });
        const body = await parseBffJson<unknown>(res);
        if (!res.ok || isBffError(body)) {
          showError(
            getServerErrorMessage(
              body.success === false ? body.code : undefined,
            ),
          );
          return;
        }
      } else if (selectedFile) {
        const fd = new FormData();
        fd.append("avatar", selectedFile);
        const res = await bffFetch("/api/me/avatar", {
          method: "POST",
          body: fd,
        });
        const body = await parseBffJson<unknown>(res);
        if (!res.ok || isBffError(body)) {
          showError(
            getServerErrorMessage(
              body.success === false ? body.code : undefined,
            ),
          );
          return;
        }
      }

      showSuccess("Профиль успешно обновлен");
      onClose();
      await onSaved?.();
    } catch {
      showError(getServerErrorMessage(undefined));
    }
  };

  if (!user) return null;

  const serverAvatarUrl =
    user.avatar && !avatarToDelete ? absoluteUploadUrl(user.avatar) : null;
  const showRemove =
    Boolean(selectedFile || (user.avatar && !avatarToDelete)) && !avatarToDelete;

  let avatarInner: ReactNode;
  if (avatarToDelete && !selectedFile) {
    avatarInner = (
      <DensityImage
        src1x={avatar1}
        src2x={avatar2}
        src3x={avatar3}
        alt=""
        width={120}
        height={120}
        className={styles.avatarPreview}
      />
    );
  } else if (previewUrl) {
    avatarInner = (
      <img src={previewUrl} alt="" className={styles.avatarPreview} />
    );
  } else if (serverAvatarUrl) {
    avatarInner = (
      <img src={serverAvatarUrl} alt="" className={styles.avatarPreview} />
    );
  } else {
    avatarInner = (
      <DensityImage
        src1x={avatar1}
        src2x={avatar2}
        src3x={avatar3}
        alt=""
        width={120}
        height={120}
        className={styles.avatarPreview}
      />
    );
  }

  const busy = isSubmitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Редактирование профиля"
      size="lg"
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <input
          ref={fileRef}
          id={fileId}
          type="file"
          accept="image/*"
          className={styles.hiddenFile}
          onChange={onFileChange}
          aria-hidden
          tabIndex={-1}
        />

        <div className={styles.avatarBlock}>
          <p className={styles.sectionTitle}>Аватар</p>
          <div className={styles.avatarFrame}>
            {avatarInner}
            {showRemove ? (
              <button
                type="button"
                className={styles.removeAvatar}
                onClick={onRemoveAvatar}
                aria-label="Удалить аватар"
              >
                ×
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.pickAvatar}
            onClick={onPickFile}
          >
            {serverAvatarUrl || previewUrl
              ? "Изменить аватар"
              : "Добавить аватар"}
          </button>
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            placeholder="Логин *"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className={styles.error}>{errors.name.message}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email *"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className={styles.error}>{errors.email.message}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            placeholder="Старый пароль"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.oldPassword)}
            {...register("oldPassword")}
          />
          {errors.oldPassword ? (
            <p className={styles.error}>{errors.oldPassword.message}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            placeholder="Новый пароль"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            {...register("newPassword")}
          />
          {errors.newPassword ? (
            <p className={styles.error}>{errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onClose}
            disabled={busy}
          >
            Отменить
          </button>
          <button type="submit" className={styles.save} disabled={busy}>
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
