# Official U.S. Visa Earlier Appointment Alert

Chrome / Edge Manifest V3 extension that watches an **already-open, already-authenticated official U.S. visa appointment calendar** and alerts the user when a visible appointment is earlier than their chosen cutoff date.

Version 3.0 also fingerprints visible calendar structure and notifies when that structure changes. A privacy-minimal Gmail API history monitor creates one notification for every newly added Inbox or Sent message without keeping Gmail open; it never reads or stores subjects, addresses, recipients, or message bodies. Its optional installable companion app can relay sanitized alerts through WeCom, WeChat Official Account, and WhatsApp Cloud API.

Version 3.1 adds a page-local crawler and anti-crawler signal collector for supported official visa portals. It detects diagnostic conditions such as CAPTCHA/challenge surfaces, known bot-protection resource markers, bursty page/resource changes, and low-confidence automation-like event patterns. These signals are stored as redacted structural facts and shown in the popup as **Portal protection signals**.

Version 3.2 adds the RuntimeCollector V2 and crawler documents as a Chrome-extension-safe structural fact pipeline. Instead of writing raw DOM JSONL files, it stores redacted source/type channels in `chrome.storage.local`. Coverage includes DOM element/attribute/text-change facts, CSSOM rule signatures, iframe/shadow-root structure, resource timing summaries, fetch/XHR/sendBeacon/WebSocket/image/script observations, console/scheduling/navigation/runtime errors, local/session/cookie storage snapshots, IndexedDB opens, service-worker registrations, WebAssembly usage, crawler timing regularity, network bursts, bot-protection headers, redirects, blocks, and provider fingerprints. Each fact carries a redacted context block with session, page, device, network, and collector-version fields.

Open **Runtime diagnostics** from the popup to inspect those channels in a full browser tab for any HTTP or HTTPS website. The same runtime, crawler-pattern, and anti-crawler/provider detection used for the visa portal now feeds the diagnostics page for general websites. The diagnostics page includes a BuiltWith-style technology profile, channel counts, recent fact table, JSON export, clearing controls, and website open/focus actions.

Runtime diagnostics also includes a deterministic Fact -> Organ -> Organ Graph -> Presentation Layer. Incoming runtime and crawler facts are normalized into the fixed nine-organ model from the UI specification: Energy, Flow, Supply, Value, Behavior, Lifecycle, Topology, Dependency, and Rhythm. The system creates structural-only graph edges and renders allowed presentation components such as waveforms, graphs, maps, overlays, indicators, density plots, and hotspot maps. It deliberately avoids scores, ratings, recommendations, causal claims, and fallback organ assignments.

## Standalone Runtime Diagnostics / SIG9 UI

Runtime Diagnostics can run as a normal local web app without loading the Chrome extension. This is the commercial SIG9 dashboard surface: sign in locally, choose a package, analyze any HTTP/HTTPS website, and switch between a plain-English Normal view and the raw Dev ledger.

```bash
npm start
```

Open `http://127.0.0.1:4391`. The first page is `runtime-diagnostics.html`, a standalone Runtime Diagnostics UI with:

- local sign-in/sign-up gating for the live dashboard;
- separate Plans navigation for the five SIG9 commercial packages;
- one-second rendered-page monitoring for the typed website target;
- Normal view for customer-readable health, risk, frequency, package, and recent-fact summaries;
- Dev mode for raw channels, technology profile, structural pipeline, SIG9 graph, frequency spectrum, Structure Engine, and recent facts;
- `/api/health` and `/api/runtime-diagnostics/status` for operational readiness checks;
- compact, redacted JSON export for latest diagnostics and bounded history.

Standalone Runtime Diagnostics does not use `chrome.storage` and does not require the extension. It uses a local Node server plus a persistent Playwright-controlled Chromium profile for rendered-page monitoring. The diagnostics page itself is never analyzed as the target; only the URL typed into the Analyze website field is sampled.

The normal path uses `/api/runtime-browser/analyze?url=...`, which opens or reuses the local rendered browser, injects the runtime collector, samples rendered DOM, network/resource behavior, console/page errors, structural signatures, and SIG9 frequency evidence, then streams compact updates back to the UI. If rendered inspection fails, the server falls back to structural URL analysis and records a visible `runtime/structural-fallback` fact instead of silently failing.

For authenticated or JavaScript-rendered pages:

1. Enter the portal URL.
2. Press **Analyze** to open or reuse the local secure browser runtime.
3. Sign in manually if the site requires authentication.
4. Keep the target page open in that browser profile.
5. Runtime Diagnostics samples the rendered page without storing passwords, bypassing CAPTCHA, auto-booking, or opening repeated tabs.

The Runtime Diagnostics browser profile is stored under `.ticket-sniper-runtime-diagnostics-browser/`; the Visa Monitor secure browser uses `.ticket-sniper-visa-secure-browser/`. They are intentionally separate so the general website analyzer and visa-specific monitor do not share product state.

### Commercial package configuration

Plans are backed by Authorize.Net Accept Hosted checkout. If Authorize.Net credentials or item amounts are not configured, the UI remains usable in local demo-selection mode and `/api/health` reports a degraded-but-operational state.

Set these environment variables before `npm start` when deploying a real checkout flow:

- `AUTHORIZE_NET_API_LOGIN_ID`
- `AUTHORIZE_NET_TRANSACTION_KEY`
- `AUTHORIZE_NET_SIGNATURE_KEY`
- `AUTHORIZE_NET_*_AMOUNT` for every sellable plan, module, and add-on
- `AUTHORIZE_NET_SUCCESS_URL`
- `AUTHORIZE_NET_CANCEL_URL`

Optional display labels:

- `AUTHORIZE_NET_DEVOPS_PRICE_LABEL`
- `AUTHORIZE_NET_SECURITY_PRICE_LABEL`
- `AUTHORIZE_NET_PERFORMANCE_PRICE_LABEL`
- `AUTHORIZE_NET_AI_GOVERNANCE_PRICE_LABEL`
- `AUTHORIZE_NET_ANALYTICS_PRICE_LABEL`
- `AUTHORIZE_NET_OEM_PLATFORM_PRICE_LABEL`

Optional production behavior-stream protection:

- `SIG9_BEHAVIOR_INGEST_KEY`
- `WEB_BLOOMBERG_INGEST_KEY` is still accepted as a legacy alias.

Canonical SIG9 runtime endpoints:

- `POST /api/behavior-stream` accepts compact behavior windows. When `SIG9_BEHAVIOR_INGEST_KEY` is configured, send it with `X-SIG9-Ingest-Key`.
- `GET /api/sig9/terminal` returns the live signal console model.
- `GET /api/sig9/export` returns the bounded signal-window export.

Legacy `/api/web-bloomberg/*` routes remain available only for backward compatibility with older local tools.

Use `.env.example` as the deployment checklist. This project does not load `.env` automatically; either export variables in your shell, set them in your process manager, or configure them in your hosting provider.

Run the release checks with:

```bash
npm run verify
```

### Optional first-party runtime ingest

`runtime-diagnostics-snippet.js` is an optional collector for websites you control. Add it only to first-party pages where you are allowed to collect structural runtime facts, and point `data-endpoint` at `/api/runtime-diagnostics/ingest`. It sends redacted DOM/resource/error facts to the same bounded diagnostics store used by the secure browser path.

Example:

```html
<script src="http://127.0.0.1:4391/runtime-diagnostics-snippet.js"
        data-endpoint="http://127.0.0.1:4391/api/runtime-diagnostics/ingest"
        data-flush-ms="1000"></script>
```

Do not inject this into third-party websites without permission. For general third-party analysis, use the secure rendered browser path from the Runtime Diagnostics UI.

## Safety boundary

The extension is notification-only. It does not:

- log in or store account credentials;
- bypass CAPTCHA, queues, rate limits, waiting rooms, or bot protection;
- hide automation, spoof browser fingerprints, defeat anti-bot systems, or solve challenges;
- call private or undocumented appointment APIs;
- automatically refresh pages;
- click appointment dates, submit forms, reserve slots, or pay fees;
- guarantee that a visible appointment remains available.

The structural trigger is page-local: the relevant calendar tab must be open and its calendar DOM must exist. It cannot observe a remote calendar while the browser is closed or when a logged-out page does not expose a calendar. A DOM change is a prompt to inspect the official page, not proof that a new appointment exists.

When only a logged-out or public portal page is visible, the extension can still fingerprint public page structure such as forms, buttons, links, scripts, stylesheets, and major layout roles. If that fingerprint changes after a previous baseline, it raises a **Portal changed** alert so the user can sign in manually and inspect the calendar. This structural alert does not read appointment availability and does not imply that a date opened.

Crawler and anti-crawler facts are diagnostic only. They help explain why a portal may be showing a CAPTCHA, JavaScript challenge, block page, or unusual page behavior. The extension reports these conditions to the user; it does not attempt to bypass them.

Runtime facts are diagnostic only and can be collected from normal HTTP/HTTPS websites while monitoring is enabled. They help explain whether a page changed structure, became slow, loaded new script/resource channels, touched storage, navigated inside a single-page app, or hit a page runtime error. They do not inspect private form values, request bodies, response bodies, raw page text, raw HTML, storage values, cookies, or credentials.

The user completes every booking action manually. Visa appointment checks run no more frequently than every five minutes in the extension monitor. Runtime Diagnostics is a separate website-analysis product surface and may sample the selected website every second for structural/runtime facts.

## Supported portal hosts

- `*.usvisascheduling.com`
- `ais.usvisa-info.com`
- `*.ustraveldocs.com`

U.S. visa scheduling providers vary by country. Begin from the website of the relevant U.S. embassy or consulate and follow its scheduling link. Do not enter credentials into a domain merely because its name looks similar.

## Install

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this `ticket-sniper-extension` folder.

### Upgrading from the DOM-based Gmail monitor

Version 2.2 removes `gmail-content.js` and uses the Gmail API from the background service. After reloading the extension, reload or close every Gmail tab that was already open. Old tabs retain the invalidated content-script instance until their page is reloaded and may otherwise report `chrome.runtime.sendMessage` as unavailable.

## Use

1. Navigate to the official scheduling portal through your embassy/consulate instructions.
2. Sign in manually and open the reschedule or appointment calendar.
3. Open the extension.
4. Set **Alert me for appointments earlier than** to your current appointment date or personal cutoff.
5. Select a check interval and press **Start monitoring**.
6. Keep the authenticated calendar tab open. The site may expire the session normally.
7. When alerted, review the highlighted date and complete the reservation manually.

## Direct reschedule link

Open **Calendar detection settings** and paste the exact reschedule URL obtained from the official scheduling portal linked by the relevant U.S. embassy or consulate. When the visible calendar structure changes, the notification includes **Open reschedule page**. The target opens in a dedicated tab and remains pending for up to 15 minutes through a manual sign-in flow.

The extension does not store or inject account credentials. Use the browser password manager if desired, click **Sign In** yourself, and select and confirm the appointment manually. Only supported HTTPS scheduling hosts are accepted.

## Detection settings

The built-in scanner recognizes common calendar attributes, accessible labels, ISO dates, written month names, numeric dates, and common two-month datepicker widgets where selectable dates are represented by visible day cells. For portals that mark available days with green borders or click handlers, the scanner combines the visible day number with the local month/year header. Use the options page to select month/day/year versus day/month/year or supply an additional CSS selector when an official portal changes its calendar markup.

The popup has a separate **Gmail timestamp alert** section. Complete [Gmail API OAuth Setup](GOOGLE_OAUTH_SETUP.md), choose Inbox, Sent, or both, and connect Google. The background service checks a small metadata-only result set at the selected interval; Gmail does not need to remain open.

## Companion app and messaging APIs

The companion app runs locally at `http://127.0.0.1:4390` and keeps messaging-provider secrets outside the browser extension. It supports WeCom group robots, WeChat Official Account templates, and WhatsApp Cloud API templates.

Open **Calendar detection settings** to pair the extension with the app. See [Companion App Setup](companion-app/README.md) for provider setup, installation, and security boundaries.

## Files

- `background.js` — alarms, official-tab coordination, duplicate suppression, OS notifications.
- `crawler-signals.js` — page-local crawler/anti-crawler diagnostics with redacted structural facts.
- `organ-pipeline.js` — deterministic nine-organ fact dispatch, structural graph building, and presentation render-block generation for Runtime diagnostics.
- `content.js` — visible DOM calendar scanning and in-page alerting.
- `date-parser.js` — deterministic appointment date parsing.
- `popup.*` — monitor controls and status.
- `options.*` — date-order and calendar-selector configuration.
