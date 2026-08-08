# Braids

Braids is a creative AI studio currently delivered as a static front end with authentication provided by Supabase.

## Run locally

From the repository root:

```sh
python3 -m http.server 4176 --bind 127.0.0.1
```

Open `http://127.0.0.1:4176/studio/`.

## Authentication

- Project: `creative-ai-studio`
- Supabase project reference: `xvnfxnnvckglvddpvmqj`
- Client configuration: `assets/supabase-config.js`
- Authentication behavior: `assets/auth.js`
- Protected pages use `data-auth-required="true"` on the `<body>`.

The publishable key in the browser is intentionally public. Never put a Supabase secret/service-role key or an AI provider API key in client-side files.

Before production email confirmation and password reset, configure Supabase Authentication URL settings:

- Site URL: `https://braids.ai`
- Redirect URLs:
  - `https://braids.ai/login.html`
  - `https://braids.ai/reset-password.html`
  - `http://127.0.0.1:4176/studio/login.html`
  - `http://127.0.0.1:4176/studio/reset-password.html`

## Current scope

Working now: email/password signup, email confirmation flow, login, persistent sessions, logout, password reset, and protected studio routes.

UI-only for now: model generation, uploads, gallery persistence, purchases, usage metering, and billing. These require server-side functions so provider keys and payment logic never reach the browser.
