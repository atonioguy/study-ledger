# Aquamarine data proxy (Cloudflare Worker)

A tiny private backend that holds your TickTick token and feeds the dashboard
clean JSON. Your tokens never touch the public page; only requests carrying your
secret key (`AQ_KEY`) get data.

## One-time setup (~15 min)

### 1. Register a TickTick API app
- Go to <https://developer.ticktick.com/manage> → **+ New App**.
- Set the **OAuth redirect URL** to exactly: `http://localhost:8080/callback`
- Copy the **Client ID** and **Client Secret**.

### 2. Mint your access token
From this `worker/` folder:
```bash
TT_CLIENT_ID=your_id TT_CLIENT_SECRET=your_secret node get-ticktick-token.mjs
```
Open the printed URL, click **Allow**, and copy the access token it prints.
(The token lasts ~6 months; rerun this to refresh it.)

### 3. Deploy the worker
```bash
npm install -g wrangler        # if you don't have it
wrangler login                 # opens Cloudflare in your browser
wrangler secret put TICKTICK_TOKEN   # paste the token from step 2
wrangler secret put AQ_KEY           # make up a long random string — this is your dashboard key
wrangler deploy
```
Wrangler prints your worker URL, e.g. `https://aquamarine-data.<you>.workers.dev`.

### 4. Connect the dashboard
- Open Aquamarine → side panel → **🔗 connect data**.
- Paste the **worker URL** and the **AQ_KEY** you chose. Save.
- Your real TickTick tasks now flow into the monitor's Today list + the calendar.

The key lives only in *your* browser (localStorage), never in the repo — so the
public page shows the cozy room to everyone, but your tasks only to you.

### 5. (optional) Lock it down further
- In `wrangler.toml`, set `ALLOW_ORIGIN` to your Pages origin
  (e.g. `https://atonioguy.github.io`) and `wrangler deploy` again.
- For full login-gating, put the worker behind **Cloudflare Access** (free).

## Endpoint
`GET /ticktick`  (header `x-aq-key: <AQ_KEY>`) → `{ tasks: [{title, due, allDay, priority, project}], ts }`
