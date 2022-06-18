import dynamic from "next/dynamic";

/** A web page to test the extension components. Will only show in development */
function TestPage() {
  return <LazyPopup />;
}

const LazyPopup = dynamic(() => import("../popup"), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Hide page in production
export const getStaticProps = () => {
  return process.env.NODE_ENV === "production"
    ? { notFound: true, props: {} }
    : { props: {} };
};

export default TestPage;
