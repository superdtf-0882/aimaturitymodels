// Which page has a Markdown copy, and which map describes it (OKF-TOGAF#158,
// 100-DT2 section 4). One set of rules, read by the shared layout for each
// page's two tags and by the map's generator and self-test. Plain CommonJS
// with no Node-only imports, so the browser bundle can carry it.
//
// A copy lives beside its page: the route without its trailing slash, plus
// ".md" (served as Markdown at that path, measured in 101-CC section 2).
// Substantive pages only -- the ones that carry model, Strata, EA OKF or
// function-model content. The interactive assessment and readout pages, the
// indexes (which the maps replace) and the site's own pages get none.
const COPY_RULES = [
  /^\/models\/(sdlc|pdlc|prioritization|ea)\/whole-model-view\/$/,
  /^\/models\/(sdlc|pdlc|prioritization)\/deep-dive\/d\d+\/$/,
  /^\/models\/prioritization\/strategic-value-matrix\/$/,
  /^\/strata\/$/,
  /^\/eaokf\/$/,
  /^\/functionmodels\/(pm|productmarketing|softwareengineering)\/$/,
];

// A route as the site serves it: no query or fragment, trailing slash on.
function normalize(route) {
  const r = String(route || "/").split(/[?#]/)[0] || "/";
  return r.endsWith("/") ? r : r + "/";
}

function copyFor(route) {
  const r = normalize(route);
  return COPY_RULES.some((re) => re.test(r)) ? r.slice(0, -1) + ".md" : null;
}

function mapFor(route) {
  const r = normalize(route);
  if (r.startsWith("/models/")) return "/models/llms.txt";
  if (r.startsWith("/functionmodels/")) return "/functionmodels/llms.txt";
  if (r.startsWith("/strata/")) return "/strata/llms.txt";
  if (r.startsWith("/eaokf/")) return "/eaokf/llms.txt";
  return "/llms.txt";
}

module.exports = { copyFor, mapFor, normalize };
