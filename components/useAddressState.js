import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// OKF-TOGAF#130: a page's in-page state, kept in the address. The rules and
// the reasons are in lib/address-state.js; each page's codec is in
// lib/address-codecs.js.
//
//   const [state, commit] = useAddressState(codec);
//   commit(next, { step: true })    // a view: adds a history step
//   commit(next)                    // an answer: only updates the address
//
// The page renders its default first (that is what the server sends), then
// reads the address once it is in the browser: a first visit, a reload, a
// shared link and a return from another page all land here. Back and Forward
// inside the page arrive as popstate.
//
// READ BEFORE THE PAGE IS DRAWN. The address is read in a layout effect, which
// runs after React builds the page and before the browser draws it, so the
// restored state is what is first seen. In a plain effect it ran after the
// drawing: arriving back on a page showed its default for a frame or two
// (about 10 and 26 ms, measured), and the fifth outside run's snapshots caught
// it on 11 of 87 returns (210-CC). The server has no layout effects and never
// sees the part after #, so there the plain effect stands in, and a full
// reload still draws the default once before the browser's script runs.
const { write, restore, traverseTo } = require("../lib/address-state");
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function useAddressState(codec) {
  const codecRef = useRef(codec);
  codecRef.current = codec;
  const [state, setState] = useState(() => codec.initial());
  const stateRef = useRef(state);

  useIsoLayoutEffect(() => {
    // This page's own path and query. A Back or Forward that lands anywhere
    // else belongs to the page arriving, and traverseTo leaves it alone.
    const pagePath = window.location.pathname + window.location.search;
    const next = restore(window, codecRef.current, stateRef.current);
    stateRef.current = next;
    setState(next);
    function onPopState(e) {
      const moved = traverseTo(window, e, codecRef.current, stateRef.current, pagePath);
      if (moved === null) return;
      stateRef.current = moved;
      setState(moved);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // The next state is worked out from the ref, not inside a state updater,
  // so the history is written once even where React runs an updater twice.
  const commit = useCallback((update, { step = false } = {}) => {
    const next = typeof update === "function" ? update(stateRef.current) : update;
    stateRef.current = next;
    setState(next);
    write(window, codecRef.current.toParams(next), { step });
  }, []);

  return [state, commit];
}
