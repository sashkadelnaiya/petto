"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bffFetch } from "@/shared/api/bff-client";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";
import { Modal } from "@/shared/ui/modal/Modal";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "./CreatePostModal.module.css";

const CreatePostMapPicker = dynamic(
  () => import("./CreatePostMapPicker").then((m) => m.CreatePostMapPicker),
  { ssr: false },
);

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type CreatedPost = {
  id: number;
};

const MAX_PHOTOS = 5;

function formatEventDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function CreatePostModal({ open, onClose, onCreated }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const photoPreviews = useMemo(
    () => photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [photos],
  );

  useEffect(() => {
    return () => {
      photoPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const resetForm = () => {
    setStatus("lost");
    setDescription("");
    setAddress("");
    setHashtag("");
    setEventDate("");
    setLatitude(null);
    setLongitude(null);
    setPhotos([]);
  };

  const handlePickPhotos = (files: FileList | null) => {
    if (!files) return;
    const onlyImages = Array.from(files).filter((file) => file.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...onlyImages].slice(0, MAX_PHOTOS));
  };

  const handleCreate = async () => {
    if (!description.trim() || !address.trim() || !hashtag.trim() || !eventDate) {
      showError("Заполните обязательные поля.");
      return;
    }
    if (latitude == null || longitude == null) {
      showError("Выберите место на карте.");
      return;
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      showError("Некорректная дата события.");
      return;
    }

    setSubmitting(true);
    try {
      const postRes = await bffFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          status,
          description: description.trim(),
          event_date: formatEventDate(parsedDate),
          address: address.trim(),
          latitude,
          longitude,
          hashtag: hashtag.trim().toLowerCase(),
        }),
      });
      const postJson = await parseBffJson<CreatedPost>(postRes);
      if (!postRes.ok || isBffError(postJson)) {
        showError(getServerErrorMessage(postJson.success === false ? postJson.code : undefined));
        return;
      }

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((file) => formData.append("photos", file));
        const photosRes = await bffFetch(`/api/posts/${postJson.data.id}/photos`, {
          method: "POST",
          body: formData,
        });
        const photosJson = await parseBffJson<unknown>(photosRes);
        if (!photosRes.ok || isBffError(photosJson)) {
          showError(
            getServerErrorMessage(photosJson.success === false ? photosJson.code : undefined),
          );
          return;
        }
      }

      showSuccess("Пост успешно создан");
      onClose();
      resetForm();
      onCreated?.();
      router.refresh();
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (submitting) return;
        onClose();
      }}
      title="Создать пост"
      size="lg"
    >
      <div className={styles.form}>
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
          placeholder="Описание *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <input
          className={styles.input}
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Адрес *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className={styles.mapSection}>
          <p className={styles.mapLabel}>Выберите место на карте *</p>
          <div className={styles.mapWrap}>
            <CreatePostMapPicker
              status={status}
              latitude={latitude}
              longitude={longitude}
              onPick={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>
          {latitude != null && longitude != null ? (
            <p className={styles.coords}>
              Широта: {latitude.toFixed(6)} | Долгота: {longitude.toFixed(6)}
            </p>
          ) : null}
        </div>

        <input
          className={styles.input}
          placeholder="Хештег *"
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
        />

        <div className={styles.photosSection}>
          <p className={styles.mapLabel}>Фотографии ({photos.length}/5)</p>
          <div className={styles.photosRow}>
            {photoPreviews.map(({ file, url }, idx) => (
              <div key={`${file.name}-${idx}`} className={styles.photoItem}>
                <img src={url} alt="" className={styles.photo} />
                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label="Удалить фото"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <label className={styles.addPhoto}>
                <span className={styles.addPlus}>+</span>
                <span className={styles.addText}>Добавить</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className={styles.hidden}
                  onChange={(e) => {
                    handlePickPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className={styles.submit}
          onClick={handleCreate}
          disabled={submitting}
        >
          {submitting ? "Создание..." : "Создать пост"}
        </button>
      </div>
    </Modal>
  );
}
