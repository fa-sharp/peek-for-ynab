import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const LazyProvider = dynamic<{ children: ReactNode }>(
  () => import("../lib/context").then((c) => c.AppProvider),
  {
    loading: () => <div>Loading...</div>,
    ssr: false
  }
);

const LazyPopup = dynamic<unknown>(() => import("../popup").then((p) => p.PopupView), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const LazyOptions = dynamic<unknown>(
  () => import("../options").then((o) => o.OptionsView),
  {
    loading: () => <div>Loading...</div>,
    ssr: false
  }
);

/** A web page to test the extension components. Will only show in development */
function TestPage() {
  return (
    <LazyProvider>
      <main style={{ display: "flex", width: "100%" }}>
        <LazyPopup />
        <LazyOptions />
      </main>
    </LazyProvider>
  );
}

// Hide page in production
export const getStaticProps = () => {
  return process.env.NODE_ENV === "production"
    ? { notFound: true, props: {} }
    : { props: {} };
};

export default TestPage;
