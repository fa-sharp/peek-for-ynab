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
        <Link href="/">
          <a className={router.pathname === "/" ? styles.currentPage : ""}>Home</a>
        </Link>
        <Link href="/help">
          <a className={router.pathname === "/help" ? styles.currentPage : ""}>
            Help/FAQ
          </a>
        </Link>
        <Link href="/privacy">
          <a className={router.pathname === "/privacy" ? styles.currentPage : ""}>
            Privacy Policy
          </a>
        </Link>
      </nav>
      <div className={styles.pageContent}>{children}</div>
    </main>
  );
};

export default WebLayout;
