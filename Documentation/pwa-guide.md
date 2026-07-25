# Progressive Web App (PWA) Guide

meshRF ships as an installable **Progressive Web App**, so you can run it in its own window on desktop or add it to your home screen on mobile, without needing an app store.

## 1. Installing on Desktop (Chrome / Edge)

1. Open meshRF in your browser (e.g. `http://localhost`, or wherever your instance is hosted).
2. Look for the **install icon** (⊕ or a monitor-with-arrow icon) in the address bar.
3. Click it, then **Install**.

meshRF now runs in its own standalone window, separate from your regular browser tabs, with no address bar or browser chrome.

> [!TIP]
> If you don't see the install icon, open the browser menu (⋮) and look for **"Install meshRF..."** or **"Apps" → "Install this site as an app"**.

## 2. Installing on Mobile (iOS / Android)

**iOS (Safari):**

1. Open meshRF in Safari.
2. Tap the **Share** icon.
3. Select **"Add to Home Screen"**.

**Android (Chrome):**

1. Open meshRF in Chrome.
2. Tap the **⋮** menu.
3. Select **"Install app"** (or **"Add to Home screen"**).

## 3. Offline Behavior

meshRF pre-caches its application shell (UI, static assets, and the WASM propagation engine) so the app **loads instantly even without a network connection**.

- The map UI and offline-capable tools (Link Analysis, ITM/WASM calculations) work without a live connection to the `rf-engine` backend.
- Tools that require the backend (Viewshed, Site Optimization, elevation lookups) still need a network path to your `rf-engine` instance — offline mode covers the app shell, not backend-dependent physics.
- API requests (`/api/*`) are **not** cached; they always go to the network. If a request fails while offline, it is queued via background sync and retried automatically once connectivity returns.

## 4. Updates

New versions are detected automatically. When an update is available, meshRF shows an in-app prompt — accept it to reload with the latest version. This avoids silently serving a stale cached build.

## 5. Uninstalling

- **Desktop**: Open the app, click the **⋮** menu in its window title bar, and choose **"Uninstall meshRF"** (or remove it from `chrome://apps`).
- **iOS/Android**: Long-press the home screen icon and choose **Remove/Uninstall**, same as any other app.
