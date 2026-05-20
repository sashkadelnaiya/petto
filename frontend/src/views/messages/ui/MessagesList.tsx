"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { bffFetch } from "@/shared/api/bff-client";
import { Modal } from "@/shared/ui/modal/Modal";
import avatarFallback from "@/shared/assets/avatar.png";
import search1 from "@/shared/assets/search.png";
import search2 from "@/shared/assets/search@2x.png";
import search3 from "@/shared/assets/search@3x.png";
import checkmarkDone from "@/shared/assets/checkmark-done_chat.png";
import checkmarkDone2x from "@/shared/assets/checkmark-done_chat@2x.png";
import checkmarkDone3x from "@/shared/assets/checkmark-done_chat@3x.png";
import checkmark from "@/shared/assets/checkmark_chat.png";
import checkmark2x from "@/shared/assets/checkmark_chat@2x.png";
import checkmark3x from "@/shared/assets/checkmark_chat@3x.png";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { useAuth } from "@/features/auth/model/auth-context";
import styles from "./MessagesPage.module.css";

type ChatItem = {
  id: number;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message_text: string | null;
  last_message_sender_id: number | null;
  unread_count: number;
  last_message_read: number | boolean | null;
};

type ChatsPayload = {
  chats: ChatItem[];
};

function resolveAvatar(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}${src}`;
}

export function MessagesList() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [actionChat, setActionChat] = useState<ChatItem | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await bffFetch("/api/chats", { cache: "no-store" });
        const json = await parseBffJson<ChatsPayload>(res);
        if (!res.ok || isBffError(json)) {
          showError(getServerErrorMessage(json.success === false ? json.code : undefined));
          return;
        }
        if (mounted) {
          setChats(json.data.chats);
        }
      } catch {
        showError(getServerErrorMessage(undefined));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [showError]);

  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      try {
        const tokenRes = await bffFetch("/api/socket/token", { cache: "no-store" });
        if (!tokenRes.ok) return;
        const tokenJson = (await tokenRes.json()) as { success: boolean; data?: { token: string } };
        if (!tokenJson.success || !tokenJson.data?.token || cancelled) return;
        const socketBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000").replace(
          /\/$/,
          "",
        );
        const socket = io(socketBase, { auth: { token: tokenJson.data.token } });
        socketRef.current = socket;
        socket.on("connect", () => {
          setChats((prev) => {
            prev.forEach((chat) => socket.emit("join_chat", chat.id));
            return prev;
          });
        });

        socket.on("new_message", (incoming: { chat_id: number; sender_id: number; text: string }) => {
          setChats((prev) => {
            const idx = prev.findIndex((chat) => Number(chat.id) === Number(incoming.chat_id));
            if (idx < 0) return prev;
            const updated = [...prev];
            const current = updated[idx];
            const mine = Number(incoming.sender_id) === Number(user?.id);
            updated[idx] = {
              ...current,
              last_message_text: incoming.text,
              last_message_sender_id: incoming.sender_id,
              last_message_read: mine ? 0 : current.last_message_read,
              unread_count: mine ? current.unread_count : (Number(current.unread_count) || 0) + 1,
            };
            const [item] = updated.splice(idx, 1);
            updated.unshift(item);
            return updated;
          });
        });

        socket.on("messages_read", (payload: { chatId: number; readerId: number }) => {
          setChats((prev) =>
            prev.map((chat) => {
              if (Number(chat.id) !== Number(payload.chatId)) return chat;
              const lastMine = Number(chat.last_message_sender_id) === Number(user?.id);
              if (lastMine && Number(payload.readerId) !== Number(user?.id)) {
                return { ...chat, last_message_read: 1 };
              }
              if (!lastMine && Number(payload.readerId) === Number(user?.id)) {
                return { ...chat, unread_count: 0 };
              }
              return chat;
            }),
          );
        });
        socket.on("message_updated", (payload: { messageId: number; chatId: number; text: string }) => {
          setChats((prev) =>
            prev.map((chat) =>
              Number(chat.id) === Number(payload.chatId)
                ? { ...chat, last_message_text: payload.text }
                : chat,
            ),
          );
        });
        socket.on("message_deleted", async () => {
          const res = await bffFetch("/api/chats", { cache: "no-store" });
          const json = await parseBffJson<ChatsPayload>(res);
          if (!res.ok || isBffError(json)) return;
          setChats(json.data.chats);
        });
        socket.on("chat_deleted", (payload: { chatId: number; deletedForUserId: number }) => {
          if (Number(payload.deletedForUserId) !== Number(user?.id)) return;
          setChats((prev) =>
            prev.filter((chat) => Number(chat.id) !== Number(payload.chatId)),
          );
        });
      } catch {
        // Keep HTTP polling behavior when sockets are unavailable.
      }
    };
    void connect();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    chats.forEach((chat) => socket.emit("join_chat", chat.id));
  }, [chats]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current != null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => (chat.other_user_name ?? "").toLowerCase().includes(q));
  }, [chats, search]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = (chat: ChatItem) => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setActionChat(chat);
      setActionOpen(true);
      clearLongPressTimer();
    }, 420);
  };

  const handleDeleteChat = async () => {
    if (!actionChat || actionBusy) return;
    setActionBusy(true);
    try {
      const res = await bffFetch(`/api/chats/${actionChat.id}`, { method: "DELETE" });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(getServerErrorMessage(json.success === false ? json.code : undefined));
        return;
      }
      setChats((prev) => prev.filter((item) => item.id !== actionChat.id));
      setActionOpen(false);
      setActionChat(null);
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <section className={styles.root} aria-label="Список чатов">
      <div className={styles.searchRow}>
        <div className={styles.searchCluster}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={searchOpen ? "Скрыть поиск" : "Поиск"}
            onClick={() => {
              setSearchOpen((prev) => {
                if (prev) setSearch("");
                return !prev;
              });
            }}
          >
            <DensityImage
              src1x={search1}
              src2x={search2}
              src3x={search3}
              alt=""
              width={36}
              height={36}
              className={styles.iconBtnImg}
            />
          </button>
          <div className={`${styles.searchGrow} ${searchOpen ? styles.searchGrowOpen : ""}`}>
            <div className={styles.searchGrowInner}>
              <div className={styles.searchFieldWrap}>
                <div className={styles.searchShell}>
                  <input
                    ref={searchInputRef}
                    className={styles.searchInput}
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    placeholder="Поиск по имени пользователя..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    tabIndex={searchOpen ? 0 : -1}
                    aria-label="Поиск чатов по имени"
                    role="searchbox"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.card}>
        {loading ? (
          <div className={styles.skeletonWrap} aria-hidden>
            <div className={`${styles.skeletonRow} ${styles.shimmer}`} />
            <div className={`${styles.skeletonRow} ${styles.shimmer}`} />
            <div className={`${styles.skeletonRow} ${styles.shimmer}`} />
          </div>
        ) : list.length === 0 ? (
          <p className={styles.state}>Пока нет чатов.</p>
        ) : (
          <ul className={styles.list}>
            {list.map((chat) => {
              const mine = user?.id != null && Number(chat.last_message_sender_id) === Number(user.id);
              const isRead = chat.last_message_read === true || chat.last_message_read === 1;
              const showUnreadDot = !mine && chat.unread_count > 0;
              const statusIcon = mine ? (isRead ? checkmarkDone : checkmark) : null;
              const status2x = mine
                ? isRead
                  ? checkmarkDone2x
                  : checkmark2x
                : null;
              const status3x = mine
                ? isRead
                  ? checkmarkDone3x
                  : checkmark3x
                : null;
              const avatarSrc = resolveAvatar(chat.other_user_avatar);
              return (
                <li key={chat.id} className={styles.item}>
                  <Link
                    href={`/messages/${chat.id}`}
                    className={styles.itemLink}
                    onClick={(event) => {
                      if (longPressTriggeredRef.current) {
                        event.preventDefault();
                        longPressTriggeredRef.current = false;
                      }
                    }}
                    onMouseDown={() => startLongPress(chat)}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(chat)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchCancel={clearLongPressTimer}
                  >
                    <img
                      className={styles.avatar}
                      src={avatarSrc ?? avatarFallback.src}
                      alt=""
                      width={64}
                      height={64}
                    />
                    <div className={styles.content}>
                      <p className={styles.name}>{chat.other_user_name ?? "Пользователь"}</p>
                      <p className={styles.preview}>{chat.last_message_text ?? "Начните диалог"}</p>
                    </div>
                    {statusIcon ? (
                      <DensityImage
                        src1x={statusIcon}
                        src2x={status2x ?? statusIcon}
                        src3x={status3x ?? statusIcon}
                        alt=""
                        width={20}
                        height={20}
                        className={styles.statusIcon}
                      />
                    ) : showUnreadDot ? (
                      <span className={styles.unreadDot} aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Modal
        open={actionOpen}
        onClose={() => {
          setActionOpen(false);
          setActionChat(null);
        }}
        size="sm"
        title="Чат"
      >
        <div className={styles.actionSheet}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
            onClick={handleDeleteChat}
            disabled={actionBusy}
          >
            {actionBusy ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
