import Link from "next/link";
import Layout from "../components/Layout";

export default function NotFound() {
  return (
    <Layout title="Page not found">
      <h1>Page not found</h1>
      <p className="dek">
        That page doesn&rsquo;t exist here. Start from{" "}
        <Link href="/">Home</Link>.
      </p>
    </Layout>
  );
}
