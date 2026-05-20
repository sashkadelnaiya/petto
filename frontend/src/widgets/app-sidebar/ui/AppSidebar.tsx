"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/logout/ui/LogoutButton";
import baidu1 from "@/shared/assets/baidu.png";
import baidu2 from "@/shared/assets/baidu@2x.png";
import baidu3 from "@/shared/assets/baidu@3x.png";
import chat1 from "@/shared/assets/chat_icon.png";
import chat2 from "@/shared/assets/chat_icon@2x.png";
import chat3 from "@/shared/assets/chat_icon@3x.png";
import home1 from "@/shared/assets/home.png";
import home2 from "@/shared/assets/home@2x.png";
import home3 from "@/shared/assets/home@3x.png";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import styles from "./AppSidebar.module.css";

const items = [
  { href: "/", label: "Лента", x1: baidu1, x2: baidu2, x3: baidu3 },
  { href: "/messages", label: "Сообщения", x1: chat1, x2: chat2, x3: chat3 },
  { href: "/profile", label: "Профиль", x1: home1, x2: home2, x3: home3 },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.aside} aria-label="Разделы приложения">
      <p className={styles.logo}>PETTO</p>
      <nav aria-label="Основная навигация">
        <ul className={styles.nav}>
          {items.map(({ href, label, x1, x2, x3 }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${active ? styles.linkActive : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={styles.navIconWrap}>
                    <DensityImage
                      src1x={x1}
                      src2x={x2}
                      src3x={x3}
                      alt=""
                      width={36}
                      height={36}
                      className={styles.navIcon}
                      decoding="async"
                    />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.logout}>
        <LogoutButton variant="ghost" />
      </div>
    </aside>
  );
}
