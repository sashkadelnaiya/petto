"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ServerViewer } from "@/shared/api/fetch-server-viewer";
import avatar1 from "@/shared/assets/avatar.png";
import avatar2 from "@/shared/assets/avatar@2x.png";
import avatar3 from "@/shared/assets/avatar@3x.png";
import bookmark1 from "@/shared/assets/bookmark.png";
import bookmark2 from "@/shared/assets/bookmark@2x.png";
import bookmark3 from "@/shared/assets/bookmark@3x.png";
import log1 from "@/shared/assets/log.png";
import log2 from "@/shared/assets/log@2x.png";
import log3 from "@/shared/assets/log@3x.png";
import write1 from "@/shared/assets/write.png";
import write2 from "@/shared/assets/write@2x.png";
import write3 from "@/shared/assets/write@3x.png";
import { useAuth } from "@/features/auth/model/auth-context";
import { absoluteUploadUrl } from "@/shared/lib/mediaUrl";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { ProfileEditModal } from "@/widgets/profile-edit-modal/ui/ProfileEditModal";
import styles from "./ProfileView.module.css";

type Props = {
  initialUser: ServerViewer | null;
};

export function ProfileView({ initialUser }: Props) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const profileData = user ?? initialUser;
  const name = (user?.name ?? initialUser?.name ?? "").trim();
  const avatarPath = (user?.avatar ?? initialUser?.avatar)?.trim() || null;
  const avatarUrl = avatarPath ? absoluteUploadUrl(avatarPath) : null;
  const hasSessionData = user != null || initialUser != null;

  return (
    <div className={styles.root}>
      {!hasSessionData ? (
        <p className={styles.fallback}>Не удалось загрузить данные профиля.</p>
      ) : (
        <>
          <section className={styles.card} aria-labelledby="profile-heading">
            <h1 id="profile-heading" className={styles.visuallyHidden}>
              Профиль
            </h1>
            <div className={styles.headerRow}>
              <div className={styles.avatarWrap} aria-hidden>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className={styles.avatarImg} />
                ) : (
                  <DensityImage
                    src1x={avatar1}
                    src2x={avatar2}
                    src3x={avatar3}
                    alt=""
                    width={130}
                    height={130}
                    className={styles.avatarImg}
                  />
                )}
              </div>
              <div className={styles.nameField}>
                <span className={styles.nameLabel}>Имя пользователя</span>
                <input
                  id="profile-display-name"
                  className={styles.nameInput}
                  readOnly
                  value={name}
                  aria-readonly="true"
                />
              </div>
              <button
                type="button"
                className={styles.editBtn}
                aria-label="Редактировать профиль"
                onClick={() => setEditOpen(true)}
              >
                <DensityImage
                  src1x={write1}
                  src2x={write2}
                  src3x={write3}
                  alt=""
                  width={20}
                  height={20}
                  className={styles.menuIcon}
                />
              </button>
            </div>
          </section>

          <nav className={styles.card} aria-label="Разделы профиля">
            <ul className={styles.menuList}>
              <li>
                <Link href="/profile/saved" className={styles.menuLink}>
                  Сохраненные посты
                  <DensityImage
                    src1x={bookmark1}
                    src2x={bookmark2}
                    src3x={bookmark3}
                    alt=""
                    width={24}
                    height={24}
                    className={styles.menuIcon}
                  />
                </Link>
              </li>
              <li>
                <Link href="/profile/my-posts" className={styles.menuLink}>
                  Мои объявления
                  <DensityImage
                    src1x={log1}
                    src2x={log2}
                    src3x={log3}
                    alt=""
                    width={24}
                    height={24}
                    className={styles.menuIcon}
                  />
                </Link>
              </li>
            </ul>
          </nav>

          {profileData ? (
            <ProfileEditModal
              open={editOpen}
              onClose={() => setEditOpen(false)}
              user={{
                id: profileData.id,
                name: profileData.name,
                email: profileData.email,
                avatar: profileData.avatar ?? null,
              }}
              onSaved={async () => {
                await refreshUser();
                router.refresh();
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
