"use client";

import dynamic from "next/dynamic";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Post, PostPhoto } from "@/entities/post/model/types";
import { bffFetch } from "@/shared/api/bff-client";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { absoluteUploadUrl } from "@/shared/lib/mediaUrl";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";
import { Modal } from "@/shared/ui/modal/Modal";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "@/widgets/create-post-modal/ui/CreatePostModal.module.css";

const CreatePostMapPicker = dynamic(
  () =>
    import("@/widgets/create-post-modal/ui/CreatePostMapPicker").then(
      (m) => m.CreatePostMapPicker,
    ),
  { ssr: false },
);

type Props = {
  open: boolean;
  post: Post | null;
  onClose: () => void;
  onSaved?: (postId: number, patch: Partial<Post>) => void;
};

const MAX_PHOTOS = 5;

function toInputDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromInputDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function EditPostModal({ open, post, onClose, onSaved }: Props) {
  const { showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<PostPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!open || !post) return;
    setStatus(post.status === "found" ? "found" : "lost");
    setDescription(post.description ?? "");
    setAddress(post.address ?? "");
    setHashtag(post.hashtag ?? "");
    setEventDate(post.event_date ? toInputDate(post.event_date) : "");
    setLatitude(post.latitude != null ? String(post.latitude) : "");
    setLongitude(post.longitude != null ? String(post.longitude) : "");
    setExistingPhotos(Array.isArray(post.photos) ? post.photos : []);
    setDeletedPhotoIds([]);
    setNewPhotos([]);

    let mounted = true;
    bffFetch(`/api/posts/${post.id}/photos`, { cache: "no-store" })
      .then((r) => parseBffJson<PostPhoto[]>(r).then((j) => ({ r, j })))
      .then(({ r, j }) => {
        if (!mounted) return;
        if (!r.ok || isBffError(j)) return;
        setExistingPhotos(Array.isArray(j.data) ? j.data : []);
      })
      .catch(() => {
        // keep optimistic photos from post payload
      });

    return () => {
      mounted = false;
    };
  }, [open, post]);

  const previewPhotos = useMemo(
    () => newPhotos.map((f) => ({ file: f, src: URL.createObjectURL(f) })),
    [newPhotos],
  );

  useEffect(
    () => () => {
      previewPhotos.forEach((p) => URL.revokeObjectURL(p.src));
    },
    [previewPhotos],
  );

  const canAddCount =
    MAX_PHOTOS - (existingPhotos.length - deletedPhotoIds.length) - newPhotos.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!post || saving) return;
    if (!address.trim() || !eventDate || !latitude || !longitude) {
      showError("Заполните обязательные поля");
      return;
    }
    setSaving(true);
    try {
      const updateRes = await bffFetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          description: description.trim() || null,
          address: address.trim(),
          hashtag: hashtag.trim().toLowerCase(),
          event_date: fromInputDate(eventDate),
          latitude: Number(latitude),
          longitude: Number(longitude),
        }),
      });
      const updateJson = await parseBffJson<unknown>(updateRes);
      if (!updateRes.ok || isBffError(updateJson)) {
        showError(
          getServerErrorMessage(
            updateJson.success === false ? updateJson.code : undefined,
          ),
        );
        return;
      }

      for (const photoId of deletedPhotoIds) {
        const res = await bffFetch(`/api/posts/${post.id}/photos/${photoId}`, {
          method: "DELETE",
        });
        if (!res.ok) break;
      }

      if (newPhotos.length > 0) {
        const form = new FormData();
        newPhotos.forEach((file) => form.append("photos", file));
        const uploadRes = await bffFetch(`/api/posts/${post.id}/photos`, {
          method: "POST",
          body: form,
        });
        if (!uploadRes.ok) {
          const uploadJson = await parseBffJson<unknown>(uploadRes);
          showError(
            getServerErrorMessage(
              uploadJson.success === false ? uploadJson.code : undefined,
            ),
          );
          return;
        }
      }

      onSaved?.(post.id, {
        status,
        description: description.trim(),
        address: address.trim(),
        hashtag: hashtag.trim().toLowerCase(),
        event_date: fromInputDate(eventDate),
        latitude: Number(latitude),
        longitude: Number(longitude),
      });
      onClose();
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать пост" size="lg">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.statusRow}>
          <button
            type="button"
            className={`${styles.statusBtn} ${status === "lost" ? styles.statusBtnActiveLost : ""}`}
            onClick={() => setStatus("lost")}
          >
            Потеряно
          </button>
          <button
            type="button"
            className={`${styles.statusBtn} ${status === "found" ? styles.statusBtnActiveFound : ""}`}
            onClick={() => setStatus("found")}
          >
            Найдено
          </button>
        </div>

        <textarea
          className={styles.input}
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <input
          className={styles.input}
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <input
          className={styles.input}
          placeholder="Адрес *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <input
          className={styles.input}
          placeholder="Хештег"
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
        />

        <div className={styles.mapSection}>
          <p className={styles.mapLabel}>Выберите место на карте *</p>
          <div className={styles.mapWrap}>
            <CreatePostMapPicker
              status={status}
              latitude={toNumberOrNull(latitude)}
              longitude={toNumberOrNull(longitude)}
              onPick={(lat, lng) => {
                setLatitude(String(lat));
                setLongitude(String(lng));
              }}
            />
          </div>
        </div>

        <div className={styles.photosSection}>
          <p className={styles.mapLabel}>
            Фотографии (
            {existingPhotos.filter((p) => !deletedPhotoIds.includes(p.id)).length +
              newPhotos.length}
            /{MAX_PHOTOS})
          </p>
          <div className={styles.photosRow}>
            {existingPhotos
              .filter((p) => !deletedPhotoIds.includes(p.id))
              .map((photo) => (
                <div key={photo.id} className={styles.photoItem}>
                  <img
                    src={absoluteUploadUrl(photo.path)}
                    alt=""
                    className={styles.photo}
                  />
                  <button
                    type="button"
                    className={styles.removePhoto}
                    onClick={() =>
                      setDeletedPhotoIds((prev) => (prev.includes(photo.id) ? prev : [...prev, photo.id]))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            {previewPhotos.map((photo, index) => (
              <div key={`${photo.file.name}-${index}`} className={styles.photoItem}>
                <img src={photo.src} alt="" className={styles.photo} />
                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={() => setNewPhotos((prev) => prev.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            ))}
            {canAddCount > 0 ? (
              <label className={styles.addPhoto}>
                <span className={styles.addPlus}>+</span>
                <span className={styles.addText}>Добавить</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className={styles.hidden}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length === 0) return;
                    setNewPhotos((prev) => [...prev, ...files].slice(0, prev.length + canAddCount));
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>

        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        <button
          type="button"
          className={styles.submit}
          style={{ background: "#9aa19c" }}
          disabled={saving}
          onClick={onClose}
        >
          Отменить
        </button>
      </form>
    </Modal>
  );
}
