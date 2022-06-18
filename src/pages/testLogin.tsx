import dynamic from "next/dynamic";

const LazyAuth = dynamic(() => import("../components/testAuth"), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

function TestLoginPage() {
  return <LazyAuth />;
}

// Hide page in production
export const getStaticProps = () => {
  return process.env.NODE_ENV === "production"
    ? { notFound: true, props: {} }
    : { props: {} };
};

export default TestLoginPage;
