import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

const { samePage } = require("../lib/address-state");

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // OKF-TOGAF#130: Back or Forward between two states of the page already
  // showing is the page's to handle (it listens for popstate itself, through
  // components/useAddressState.js). Left to the router, a step back to the
  // page's first entry would be routed as a fresh visit and jump to the top.
  // A step to another page is still the router's.
  useEffect(() => {
    router.beforePopState((state) => !samePage(state && state.as, router.asPath));
    return () => router.beforePopState(() => true);
  }, [router]);

  return <Component {...pageProps} />;
}
