import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { type ReactNode } from "react";

import styles from "./WebLayout.module.css";

const WebLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  return (
    <main className={styles.mainContent}>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <nav className={styles.nav}>
        <Link href="/" className={router.pathname === "/" ? styles.currentPage : ""}>
          Home
        </Link>
        <Link
          href="/help"
          className={router.pathname === "/help" ? styles.currentPage : ""}>
          Help/FAQ
        </Link>
        <Link
          href="/releases"
          className={router.pathname === "/releases" ? styles.currentPage : ""}>
          Release Notes
        </Link>
        <Link
          href="/privacy"
          className={router.pathname === "/privacy" ? styles.currentPage : ""}>
          Privacy Policy
        </Link>
      </nav>
      <div className={styles.pageContent}>{children}</div>
      <div
        className="mt-xxl mb-lg pt-sm"
        style={{ borderTop: "solid 1px var(--border-light)" }}>
        Built and maintained with 💕 by <a href="https://github.com/fa-sharp">fa-sharp</a>
        . Peek for YNAB is a third-party extension, and is not affiliated or supported by
        YNAB.
      </div>
    </main>
  );
};

export default WebLayout;
