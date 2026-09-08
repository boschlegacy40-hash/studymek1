# StudyMek

A single-page NGSA/CXC study app for Guyanese students — quizzes, AI tutor, Guyana history, monuments, resources, culture, and live news.

## Deploying on Render

1. Push this folder to a GitHub repo (see steps below).
2. On [render.com](https://render.com), click **New +** → **Static Site**.
3. Connect your GitHub account and select this repo.
4. Render should auto-detect the settings from `render.yaml`. If asked manually:
   - **Build Command:** (leave blank)
   - **Publish Directory:** `.`
5. Click **Create Static Site**. Render gives you a live URL like `studymek.onrender.com`.

Any time you push a new commit to the connected branch, Render redeploys automatically.

## Known limitation

Sign-in, saved quiz scores, the community leaderboard, and the admin visit log use `window.storage`, a persistence bridge that **only works inside Claude.ai's artifact viewer**. On Render (or any other host), those specific features will not persist data — everything else (quizzes, AI tutor, monuments/resources/culture pages, live news search) works normally anywhere.

To get working accounts/leaderboard on Render, `window.storage` calls would need to be swapped for a real backend (e.g. Firebase, Supabase, or a small custom API).
