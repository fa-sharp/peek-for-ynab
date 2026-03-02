"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { type ReactNode } from "react";
import { BrandGithub } from "tabler-icons-react";

import styles from "./WebLayout.module.css";

const WebLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className={styles.pageContent}>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link
              href="/"
              className={pathname === "/" ? styles.currentPage : ""}
              aria-current={pathname === "/" ? "page" : "false"}>
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/help"
              className={pathname === "/help" ? styles.currentPage : ""}
              aria-current={pathname === "/help" ? "page" : "false"}>
              Help/FAQ
            </Link>
          </li>
          <li>
            <Link
              href="/releases"
              className={pathname === "/releases" ? styles.currentPage : ""}
              aria-current={pathname === "/releases" ? "page" : "false"}>
              Release Notes
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className={pathname === "/privacy" ? styles.currentPage : ""}
              aria-current={pathname === "/privacy" ? "page" : "false"}>
              Privacy Policy
            </Link>
          </li>
        </ul>
      </nav>
      <main className={styles.mainContent}>
        <h1>Peek for YNAB</h1>
        {children}
      </main>
      <footer className={styles.footer}>
        💕 Built and maintained by <a href="https://github.com/fa-sharp">fa-sharp</a>.
        Source code available on{" "}
        <a href="https://github.com/fa-sharp/peek-for-ynab">
          <span className="icon-span">
            <BrandGithub aria-hidden size={16} />
          </span>
          GitHub
        </a>
        . Peek for YNAB is a third-party extension, and is not affiliated with or
        supported by YNAB.
      </footer>
    </div>
  );
};

export default WebLayout;
