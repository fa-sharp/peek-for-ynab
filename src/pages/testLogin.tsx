import dynamic from "next/dynamic";

/** For testing/development: after user logs in to YNAB, they are redirected to this page.
 * Will only show in development */
function TestLoginPage() {
  return <LazyAuth />;
}

const LazyAuth = dynamic(() => import("../components/testAuth"), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Hide page in production
export const getStaticProps = () => {
  return process.env.NODE_ENV === "production"
    ? { notFound: true, props: {} }
    : { props: {} };
};

export default TestLoginPage;
