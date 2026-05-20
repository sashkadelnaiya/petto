"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/model/auth-context";
import { bffFetch } from "@/shared/api/bff-client";
import sendIcon from "@/shared/assets/baidu_send_message.png";
import avatarFallback from "@/shared/assets/avatar.png";
import checkmarkDone from "@/shared/assets/checkmark-done_chat.png";
import checkmarkDone2x from "@/shared/assets/checkmark-done_chat@2x.png";
import checkmarkDone3x from "@/shared/assets/checkmark-done_chat@3x.png";
import checkmark from "@/shared/assets/checkmark_chat.png";
import checkmark2x from "@/shared/assets/checkmark_chat@2x.png";
import checkmark3x from "@/shared/assets/checkmark_chat@3x.png";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { Modal } from "@/shared/ui/modal/Modal";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "./MessagesThreadPage.module.css";

type Message = {
  id: number;
  chat_id: number;
  sender_id: number;
  text: string;
  created_at: string;
  is_read: number | boolean;
};

type MessagesPayload = {
  messages: Message[];
};

type ChatMeta = {
  id: number;
  other_user_name: string | null;
  other_user_avatar: string | null;
};

type ChatsPayload = {
  chats: ChatMeta[];
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

function formatTime(dateLike: string): string {
  const d = new Date(dateLike);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function MessagesThreadView({ chatId }: { chatId: string }) {
  const router = useRouter();
  const parsedChatId = Number(chatId);
  const { user } = useAuth();
  const { showError } = useToast();
  const listRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMeta, setChatMeta] = useState<ChatMeta | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [editValue, setEditValue] = useState("");
  const longPressTimerRef = useRef<number | null>(null);
  const initialBottomScrollDoneRef = useRef(false);

  const load = useCallback(async () => {
    const [messagesRes, chatsRes] = await Promise.all([
      bffFetch(`/api/chats/${parsedChatId}/messages`, { cache: "no-store" }),
      bffFetch("/api/chats", { cache: "no-store" }),
    ]);
    const messagesJson = await parseBffJson<MessagesPayload>(messagesRes);
    if (!messagesRes.ok || isBffError(messagesJson)) {
      showError(
        getServerErrorMessage(messagesJson.success === false ? messagesJson.code : undefined),
      );
      return;
    }
    const chatsJson = await parseBffJson<ChatsPayload>(chatsRes);
    if (!chatsRes.ok || isBffError(chatsJson)) {
      showError(getServerErrorMessage(chatsJson.success === false ? chatsJson.code : undefined));
      return;
    }
    setMessages(messagesJson.data.messages);
    setChatMeta(chatsJson.data.chats.find((chat) => Number(chat.id) === parsedChatId) ?? null);
    await bffFetch(`/api/chats/${parsedChatId}/read`, { method: "POST" });
  }, [parsedChatId, showError]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await load();
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
  }, [load, showError]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (loading) return;
    scrollToBottom("smooth");
  }, [loading, messages, scrollToBottom]);

  useEffect(() => {
    if (loading || initialBottomScrollDoneRef.current) return;
    // On first open, force position at the latest message.
    requestAnimationFrame(() => {
      scrollToBottom("auto");
      setTimeout(() => scrollToBottom("auto"), 80);
      initialBottomScrollDoneRef.current = true;
    });
  }, [loading, scrollToBottom]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 160;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current != null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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
        socket.emit("join_chat", parsedChatId);
        socket.on("new_message", (incoming: Message) => {
          if (Number(incoming.chat_id) !== parsedChatId) return;
          setMessages((prev) => {
            if (prev.some((item) => Number(item.id) === Number(incoming.id))) return prev;
            return [...prev, incoming];
          });
          void bffFetch(`/api/chats/${parsedChatId}/read`, { method: "POST" });
        });
        socket.on("messages_read", (payload: { chatId: number; readerId: number }) => {
          if (Number(payload.chatId) !== Number(parsedChatId)) return;
          if (Number(payload.readerId) === Number(user?.id)) return;
          setMessages((prev) =>
            prev.map((item) => {
              const mine = Number(item.sender_id) === Number(user?.id);
              if (!mine) return item;
              return { ...item, is_read: 1 };
            }),
          );
        });
        socket.on("message_updated", (payload: { messageId: number; chatId: number; text: string }) => {
          if (Number(payload.chatId) !== Number(parsedChatId)) return;
          setMessages((prev) =>
            prev.map((item) =>
              Number(item.id) === Number(payload.messageId)
                ? { ...item, text: payload.text }
                : item,
            ),
          );
        });
        socket.on("message_deleted", (payload: { messageId: number; chatId: number }) => {
          if (Number(payload.chatId) !== Number(parsedChatId)) return;
          setMessages((prev) =>
            prev.filter((item) => Number(item.id) !== Number(payload.messageId)),
          );
        });
        socket.on("chat_deleted", (payload: { chatId: number; deletedForUserId: number }) => {
          if (Number(payload.chatId) !== Number(parsedChatId)) return;
          if (Number(payload.deletedForUserId) !== Number(user?.id)) return;
          router.push("/messages");
        });
      } catch {
        // Fallback to HTTP-only chat when socket is unreachable.
      }
    };
    void connect();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [parsedChatId, router, user?.id]);

  const ordered = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages],
  );

  const onSend = async () => {
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("send_message", { chatId: parsedChatId, text });
      } else {
        const res = await bffFetch(`/api/chats/${parsedChatId}/messages`, {
          method: "POST",
          body: JSON.stringify({ text }),
        });
        const json = await parseBffJson<{ message: Message }>(res);
        if (!res.ok || isBffError(json)) {
          showError(getServerErrorMessage(json.success === false ? json.code : undefined));
          return;
        }
        setMessages((prev) => [...prev, json.data.message]);
      }
      setValue("");
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setSending(false);
    }
  };

  const avatarSrc = resolveAvatar(chatMeta?.other_user_avatar ?? null);
  const clearLongPressTimer = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = (message: Message, mine: boolean) => {
    if (!mine) return;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      setActionMessage(message);
      setEditValue(message.text);
      setEditingMessage(false);
      setActionOpen(true);
      clearLongPressTimer();
    }, 420);
  };

  const handleDeleteMessage = async () => {
    if (!actionMessage || actionBusy) return;
    setActionBusy(true);
    try {
      const res = await bffFetch(`/api/messages/${actionMessage.id}`, { method: "DELETE" });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(getServerErrorMessage(json.success === false ? json.code : undefined));
        return;
      }
      setMessages((prev) => prev.filter((item) => item.id !== actionMessage.id));
      setActionOpen(false);
      setActionMessage(null);
      setEditingMessage(false);
      setEditValue("");
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveEditMessage = async () => {
    if (!actionMessage || !editValue.trim() || actionBusy) return;
    setActionBusy(true);
    try {
      const res = await bffFetch(`/api/messages/${actionMessage.id}`, {
        method: "PUT",
        body: JSON.stringify({ text: editValue.trim() }),
      });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(getServerErrorMessage(json.success === false ? json.code : undefined));
        return;
      }
      setMessages((prev) =>
        prev.map((item) =>
          item.id === actionMessage.id ? { ...item, text: editValue.trim() } : item,
        ),
      );
      setActionOpen(false);
      setActionMessage(null);
      setEditingMessage(false);
      setEditValue("");
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <section className={styles.root} aria-label="Чат">
      <div className={styles.card}>
      <div className={styles.topRow}>
        {loading ? (
          <div className={styles.headerSkeleton} aria-hidden>
            <div className={`${styles.headerSkeletonBack} ${styles.shimmer}`} />
            <div className={`${styles.headerSkeletonAvatar} ${styles.shimmer}`} />
            <div className={`${styles.headerSkeletonTitle} ${styles.shimmer}`} />
          </div>
        ) : (
          <>
            <Link href="/messages" className={styles.back}>
              Назад
            </Link>
            <img
              src={avatarSrc ?? avatarFallback.src}
              alt=""
              width={32}
              height={32}
              className={styles.avatar}
            />
            <p className={styles.title}>{chatMeta?.other_user_name ?? "Диалог"}</p>
          </>
        )}
      </div>
      <div className={styles.messages} ref={listRef}>
        {loading ? (
          <div className={styles.threadSkeleton} aria-hidden>
            <div className={`${styles.bubbleSkeleton} ${styles.bubbleSkeletonLeft} ${styles.shimmer}`} />
            <div className={`${styles.bubbleSkeleton} ${styles.bubbleSkeletonRight} ${styles.shimmer}`} />
            <div className={`${styles.bubbleSkeleton} ${styles.bubbleSkeletonLeft} ${styles.shimmer}`} />
            <div className={`${styles.bubbleSkeleton} ${styles.bubbleSkeletonRight} ${styles.shimmer}`} />
          </div>
        ) : ordered.length === 0 ? (
          <p className={styles.state}>Напишите первое сообщение.</p>
        ) : (
          ordered.map((message) => {
            const mine = Number(message.sender_id) === Number(user?.id);
            const read = message.is_read === true || message.is_read === 1;
            return (
              <div key={message.id} className={`${styles.row} ${mine ? styles.rowMine : ""}`}>
                <div
                  className={`${styles.bubble} ${mine ? styles.bubbleMine : ""}`}
                  onMouseDown={() => startLongPress(message, mine)}
                  onMouseUp={clearLongPressTimer}
                  onMouseLeave={clearLongPressTimer}
                  onTouchStart={() => startLongPress(message, mine)}
                  onTouchEnd={clearLongPressTimer}
                  onTouchCancel={clearLongPressTimer}
                >
                  <p className={`${styles.text} ${mine ? styles.textMine : styles.textOther}`}>
                    {message.text}
                  </p>
                  <div className={`${styles.meta} ${mine ? styles.metaMine : styles.metaOther}`}>
                    <span>{formatTime(message.created_at)}</span>
                    {mine ? (
                      <DensityImage
                        src1x={read ? checkmarkDone : checkmark}
                        src2x={read ? checkmarkDone2x : checkmark2x}
                        src3x={read ? checkmarkDone3x : checkmark3x}
                        alt=""
                        width={14}
                        height={14}
                        className={styles.read}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className={styles.composer}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Написать сообщение..."
          maxLength={1000}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSend();
            }
          }}
          rows={1}
        />
        <button className={styles.send} onClick={onSend} disabled={!value.trim() || sending}>
          <img src={sendIcon.src} alt="Отправить" width={24} height={24} />
        </button>
      </div>
      </div>
      <Modal
        open={actionOpen}
        onClose={() => {
          setActionOpen(false);
          setEditingMessage(false);
          setActionMessage(null);
        }}
        size="sm"
        title={editingMessage ? "Редактировать сообщение" : "Сообщение"}
      >
        <div className={styles.actionSheet}>
          {editingMessage ? (
            <>
              <textarea
                className={styles.editInput}
                placeholder="Редактировать сообщение..."
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
                rows={4}
              />
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnCancel}`}
                  onClick={() => {
                    setEditingMessage(false);
                    setEditValue(actionMessage?.text ?? "");
                  }}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnSave}`}
                  onClick={handleSaveEditMessage}
                  disabled={actionBusy || !editValue.trim()}
                >
                  {actionBusy ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setEditingMessage(true)}
              >
                Редактировать
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                onClick={handleDeleteMessage}
                disabled={actionBusy}
              >
                {actionBusy ? "Удаление..." : "Удалить"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </section>
  );
}
