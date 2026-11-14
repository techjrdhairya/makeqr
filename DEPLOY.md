# Deploying MakeQR on the Firebase Spark (free) plan

Project: `makebytechd`  ·  Hosting site: `makeqr`  ·  URL: https://makeqr.web.app
On Spark, MakeQR runs as a static website + Firestore (no Cloud Run, no card needed).

## A. One-time console setup (console.firebase.google.com > makebytechd)
1. Build > Firestore Database > Create database > Production mode > keep the name `(default)`.
2. Build > Authentication > Get started > Sign-in method > enable **Google**.
3. Build > Authentication > Settings > Authorized domains > add `makeqr.web.app`.
4. Build > Hosting: make sure the site `makeqr` exists (or run `firebase hosting:sites:create makeqr`).
   (The web app config is already filled in `firebase-applet-config.json`.)

## B. One-time tools
```
npm install -g firebase-tools
firebase login
```

## C. Deploy (every time)
```
npm install
npm run build
firebase deploy --only hosting:makeqr,firestore
```

## What works on Spark
QR studio, all content types, design, templates, scanner, barcode, pricing, help, sign-in,
saved QR codes and coins (Firestore), PDF/PNG export.

## What needs the server (Blaze plan + Cloud Run)
- AI Brand Stylist and AI chat. They call Gemini from the server so your key stays secret. The key is already in `.env` for local use (`npm run dev`); for Cloud Run pass it with `--set-env-vars`.
- Server-side short-link redirects and server-hosted file pages (the app falls back to Firestore where it can)

To enable those later: upgrade to Blaze, then
```
gcloud config set project makebytechd
gcloud run deploy makeqr --source . --region asia-south1 --allow-unauthenticated --set-env-vars "GEMINI_API_KEY=<key>"
copy firebase.blaze.json firebase.json      (Windows)   |   cp firebase.blaze.json firebase.json   (Mac/Linux)
npm run build
firebase deploy --only hosting:makeqr,firestore
```
Note: Cloud Run's disk is wiped on restart, so file uploads saved by the server are not permanent.


## Render + Firestore (current setup)
API and site run on Render; short links, file records, uploaded files (max 5 MB, stored in
small pieces) and scan analytics are stored in Firestore (collections `srv_links`, `srv_files`,
`srv_scans`). Set these on the Render service:
- `FIREBASE_SERVICE_ACCOUNT` = contents of the service-account JSON (one line) — keep it secret
- `GEMINI_API_KEY`
After deploy the logs should say: `[store] Firestore persistence ENABLED`.
Add the Render domain to Firebase Authentication > Settings > Authorized domains.
