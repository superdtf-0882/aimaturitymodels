// Build-time content fetching. Per ADR-008: each model's content is
// fetched from that model's own public repo at build time -- never
// duplicated into this repo. No auth needed (CC BY 4.0 published repos).
// This file runs only in getStaticProps/getStaticPaths (Node, build time),
// never in the browser.

import yaml from "js-yaml";
import { marked } from "marked";

const SDLC_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/main";
const SDLC_REPO_URL = "https://github.com/superdtf-0882/ai-native-sdlc-maturity-model";

async function fetchRaw(path) {
  const res = await fetch(`${SDLC_RAW}/${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from SDLC repo: ${res.status}`);
  }
  return res.text();
}

export async function getSdlcShortForm() {
  const text = await fetchRaw("short_form.yml");
  return yaml.load(text);
}

export async function getSdlcDeepDive(dimId) {
  // dimId like "D1".."D13"
  const n = dimId.replace(/^D/i, "");
  const text = await fetchRaw(`deep_dives/d${n}.md`);
  return marked.parse(text);
}

export const SDLC_DIMENSION_ORDER = [
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13",
];

export const SDLC_MODEL_META = {
  name: "AI-Native SDLC Maturity Model",
  slug: "sdlc",
  repoUrl: SDLC_REPO_URL,
  capstone: "D13",
};
