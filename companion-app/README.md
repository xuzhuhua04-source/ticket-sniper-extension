# Visa Monitor Companion App

Installable local web app and notification relay for the Visa Monitor browser extension. Provider credentials remain in this service and are never placed in extension code or synchronized browser storage.

## Requirements

- Node.js 22 or newer
- A random pairing token containing at least 16 characters
- Credentials for only the messaging channels you intend to enable

## Account providers

The app supports four verified identity paths:

- Google OpenID Connect with authorization code and PKCE
- WeChat website QR-code OAuth
- WeCom organization application login
- WhatsApp one-time codes delivered through an approved authentication template

Set each provider's variables in `.env` and register these callback URLs with the corresponding provider:

- `http://127.0.0.1:4390/api/auth/callback/google`
- `http://127.0.0.1:4390/api/auth/callback/wechat`
- `http://127.0.0.1:4390/api/auth/callback/wecom`

For a hosted deployment, set `AUTH_BASE_URL` to the public HTTPS origin and register matching HTTPS callback URLs. WhatsApp does not expose a general-purpose social login button; this app uses its supported authentication-template OTP flow instead.

## Start the app

1. Copy `.env.example` to `.env`.
2. Replace `COMPANION_TOKEN` with a long random value.
3. From this directory, run `npm start`.
4. Open `http://127.0.0.1:4390`.
5. Use the browser install button to install the PWA, if desired.
6. In the extension options, enable the companion app and enter the same pairing token.

The Node service must remain running for API delivery. Installing the PWA does not move provider secrets into the browser.

## WeCom group robot

1. Add a group robot to the intended WeCom group.
2. Copy its complete HTTPS webhook URL into `WECOM_WEBHOOK_URL`.
3. Restart the companion service.

The service sends a text message containing the event title, sanitized message, time, and optional official scheduling URL.

## WeChat Official Account

Set `WECHAT_APP_ID`, `WECHAT_APP_SECRET`, `WECHAT_OPEN_ID`, and `WECHAT_TEMPLATE_ID`. The account and recipient must be eligible to receive template messages under WeChat's current platform rules.

The default template field mapping is `first` for the title, `keyword1` for event type, `keyword2` for the message, `keyword3` for time, and `remark` for the official link. Change the `WECHAT_TEMPLATE_FIELD_*` variables when the approved template uses different field names.

## WhatsApp Cloud API

Set the phone number ID, access token, recipient number, approved template name, and template language. The configured template must contain three body text parameters in this order: alert title, alert message, and event time.

Template approval, recipient eligibility, business verification, conversation rules, and provider charges are controlled by Meta. The app does not bypass those requirements.

## Authorize.Net billing

Configure Authorize.Net API credentials, Signature Key, and `AUTHORIZE_NET_*_AMOUNT` values for any plans you intend to sell. Checkout uses Authorize.Net Accept Hosted so card collection occurs on Authorize.Net pages instead of inside the app.

The downloadable app contains no card-handling UI. Payment methods, settlement, fraud controls, and merchant settings are controlled in Authorize.Net. Plan buttons remain disabled until valid Authorize.Net credentials and an amount are configured.

## Windows application

Run `npm run dist:win` to produce the NSIS installer under `dist-app/`. The installed desktop application hosts the same local service and stores event history in the current Windows user's application-data directory.

On first launch, the installed app creates `%APPDATA%\Visa Monitor Companion\.env` from the safe template. Close the app, edit that file with provider credentials, then reopen it. Never place provider secrets in the browser extension.

## API and privacy boundary

- `GET /api/status` reports channel configuration without returning secrets.
- `POST /api/events` accepts sanitized extension events with the pairing token.
- `POST /api/test` sends a deliberate test through each configured channel.
- Provider responses are reduced to delivery status; credentials are never written to the event log.
- Gmail events contain only mailbox and timestamp information, not message content or correspondents.

Do not commit `.env`. Rotate a provider credential immediately if it is exposed.

## Verification

Run `npm test` for service tests and `npm run verify` while the service is running for the browser smoke test.
