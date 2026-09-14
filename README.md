# StudyMek

A single-page NGSA/CXC study app for Guyanese students — quizzes, AI tutor, Guyana history, monuments, resources, culture, and **live news** (now genuinely live).

## What changed: static site → small backend

The site used to be a pure static site. The **Live News** feature needs to call Anthropic's API with a secret API key, and that key can never live in browser-visible code — so this is now a tiny Node/Express server that:
1. Serves `index.html` and all the site's static content, exactly as before.
2. Adds one backend route, `POST /api/news`, which holds your Anthropic API key server-side and does the actual web search + summarization.

Everything else about the site (quizzes, tutor, monuments, history, accounts) is unchanged and still runs entirely in the browser.

## Deploying on Render

1. Push this folder (`index.html`, `server.js`, `package.json`, `render.yaml`, this README) to a GitHub repo.
2. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys). This is a paid API — web searches cost a small amount per call. The server caches results for 15 minutes so repeated clicks don't re-charge you.
3. On [render.com](https://render.com), click **New +** → **Web Service** (not Static Site this time).
4. Connect your GitHub account and select this repo.
5. Render should auto-detect the settings from `render.yaml`. If asked manually:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Before or after creating the service, go to its **Environment** tab and add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your actual API key from step 2
7. Click **Create Web Service** (or **Save Changes** if it's already created, which triggers a redeploy). Render gives you a live URL like `studymek.onrender.com`.

Any time you push a new commit to the connected branch, Render redeploys automatically.

## Testing the news feature

Once deployed, click **Refresh Live News** on the site. If it fails, check the **Logs** tab on your Render service — the server prints the actual error there (most commonly: the API key is missing, mistyped, or has run out of credit).

## Known limitation

Sign-in, saved quiz scores, and the community leaderboard use `window.storage`, a persistence bridge that **only works inside Claude.ai's artifact viewer**. On Render (or any other host), those specific features will not persist data — everything else (quizzes, AI tutor, live news, monuments/resources/culture pages) now works normally on a real deployment.

To get working accounts/leaderboard on Render, `window.storage` calls would need to be swapped for real storage — either browser `localStorage` (per-device only, no setup needed) or a proper database like Firebase or Supabase (works across devices, needs its own account setup).
