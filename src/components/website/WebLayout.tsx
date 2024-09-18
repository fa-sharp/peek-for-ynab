"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { type ReactNode } from "react";

import styles from "./WebLayout.module.css";

const WebLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className={styles.pageContent}>
      <nav className={styles.nav}>
        <Link href="/" className={pathname === "/" ? styles.currentPage : ""}>
          Home
        </Link>
        <Link href="/help" className={pathname === "/help" ? styles.currentPage : ""}>
          Help/FAQ
        </Link>
        <Link
          href="/releases"
          className={pathname === "/releases" ? styles.currentPage : ""}>
          Release Notes
        </Link>
        <Link
          href="/privacy"
          className={pathname === "/privacy" ? styles.currentPage : ""}>
          Privacy Policy
        </Link>
      </nav>
      <main className={styles.mainContent}>{children}</main>
      <footer className={styles.footer}>
        💕 Built and maintained by <a href="https://github.com/fa-sharp">fa-sharp</a>.
        Peek for YNAB is a third-party extension, and is not affiliated with or supported
        by YNAB.
      </footer>
    </div>
  );
};

export default WebLayout;
