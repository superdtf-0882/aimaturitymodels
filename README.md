# aimaturitymodels.com

Site for the AI-Native Maturity Model family. Governed by `ADR-008` and built under `AC-008` (`OKF TOGAF` corpus, private governance repo — not this one).

## What this repo is

Content-only. It never duplicates any model's content — it fetches each model's canonical markdown/YAML at **build time** from that model's own public repo (e.g. `ai-native-sdlc-maturity-model`), no auth required (CC BY 4.0). If a model's content changes, this site picks it up on its next build; nothing here needs manual updating to stay current.

Family Map and Strata pages are this site's own original content — not fetched from anywhere, not CC BY licensed like the model repos. See `pages/index.js` and `pages/strata.js`.

## Status

First model live: **AI-Native SDLC Maturity Model** (Whole-Model View, Narrative, 13 Deep-Dives). PDLC and Prioritization apps are not yet built — both models are still gated behind `OI-040` in the governing corpus (no repos of their own yet). They'll be added incrementally once that gate opens, per `WP-AIMM-01`'s own stated sequencing — their absence right now isn't a bug.

Three dimensions in the SDLC content (D6, D9, D11) carry a visible "under review" note — shipped this way deliberately (Option A: ship now, label the gaps), not an oversight.

## Design system

Inherits `davidfacer.com`'s design system (`C-007`): primary blue `#185fa5`, orange `#926318`, breadcrumb + back-link navigation, no new tabs from internal links, bottom-right attribution. This domain's own portfolio identity is `VP-004` (orange, `PDT-001`). The Whole-Model View grid follows `DS-010` (dense reference grid pattern) and System 3's maturity-level colors.

## Licensing

This repo's own content (site design, Family Map copy, Strata explainer) is © 2026 David Facer, all rights reserved — no open license, same posture as `davidfacer.com` itself, distinct from the CC BY 4.0 model content it displays. See the licensing registry consultation (`OKF TOGAF`, `briefs/2026-07-23-licensing-registry/`) for the full reasoning.

## Local development

```
npm install
npm run dev
```

Requires network access at build time to fetch model content from GitHub.
