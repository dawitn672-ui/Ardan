---
name: "ios-capacitor-release"
description: "Ship a one-file web game to the Apple App Store as an iPhone app with no Mac: Capacitor 8 (Swift Package Manager) around a WKWebView, Codemagic's cloud Mac for signing and builds, TestFlight, App Review. Use when preparing Ardan's iPhone build, auditing code against the iPhone build rules, writing capacitor.config.ts or codemagic.yaml, or answering App Store questions."
---

# Ardan on the iPhone: the how-to

The route and its reasons are in `docs/IOS_ROADMAP.md` (sources, verdicts, the audit); the choices are D-071 to D-076.
This is the order of work when the stage comes. Re-read the roadmap's §1 and §2 first: Xcode and Capacitor move every
year, and a fact marked **[U]** there must be checked before it is relied on. Update both files when you learn something.

## 0. Before any stage: the build rules (order 62, rule 21)

Every change to the game, from today, keeps these (the full text is in CLAUDE.md and the roadmap §9):
pointer events only (with `pointercancel`); nothing on hover, right-click, double-click or keys alone; 44-point targets;
375×667 to Pro Max, `env(safe-area-inset-*)`, `dvh`; relative paths, no network, offline; HTML panels, one canvas per map
with culling, redraw on change; animate transform and opacity only; no data that grows forever, no allocations in a frame
loop, Map by id; saves only through `SAVES` (and small keys through `UI.store`); one AudioContext, unlocked on the first
tap, paused in the background. A change that would make the iPhone harder: say so and offer the version that keeps the
route open.

Check a build against the touch rules:
```sh
node tools/build.mjs --out=/tmp/ardan/ios/x.html
node docs/research/ios/tap-probe.mjs /tmp/ardan/ios/x.html --verbose          # 44-pt targets at 375x667, sideways scroll
PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb npx playwright install webkit               # once (Linux also: install-deps webkit)
PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb node docs/research/ios/tap-probe.mjs /tmp/ardan/ios/x.html --engine=webkit
PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb node docs/research/ios/webkit-boot.mjs /tmp/ardan/ios/x.html   # CSP, blob worker, a save
```

## 1. Performance (X7 part 2, X5, D12b-1)

1. `node tools/bench/phone-load.mjs x.html --runs=3` and `next-month-speed.mjs --throttle=4` on the year-0 and year-50 saves.
   Budget at 4x: title < 3 s, first Life screen < 6 s, Next month < 1 s.
2. Map pans draw once a frame (rAF), never once a pointer move; no arrays, objects or closures inside a draw loop.
3. The saved state holds still over decades (year 0 and year 50 within a set ratio, held by a test).

## 2. iPhone readiness (I1-2)

1. `src/core/release/page.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
   Without `viewport-fit=cover` every safe-area inset is 0.
2. One base rule: `html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}`;
   inputs keep `user-select:text`.
3. `vh` → `dvh` with a `vh` line before it; `:hover` inside `@media (hover:hover)`; `pointercancel` on every drag.
4. Audio: one module, one `AudioContext` for score and effects; made on the first `pointerdown`; `suspend()` on
   `visibilitychange` hidden and on Capacitor `App` `pause`, `resume()` on `resume`; `navigator.audioSession.type = 'playback'`
   while sound or music is on (iOS 17+, guard it).
5. Saves: `SAVES.backend` = `idb` | `local` | `native`, chosen once at boot; only `SAVES.open/get/put/clear` know it.
   `UI.store` gets the same switch. `UI.download` gets a native branch. Nothing else in the game changes.
6. Check at 375×667, 390×844, 393×852, 440×956, in Chromium and WebKit.

## 3. The `www/` build (I1-3)

```sh
node tools/build.mjs --out=app/www/index.html     # the one-file page, exactly what CI tests
```
Ship the one file first (D-075). Make the split build (plain `.js` files, `script-src 'self'`, the worker as a file) only if
a TestFlight build on a real iPhone misses the load budget.

## 4. Capacitor (I1-4), all on Linux

```sh
mkdir -p app/www && cd app && npm init -y
npm i -D @capacitor/cli@^8.6
npm i @capacitor/core@^8.6 @capacitor/ios@^8.6 @capacitor/app @capacitor/filesystem @capacitor/preferences \
      @capacitor/splash-screen @capacitor/status-bar @capacitor/haptics @capacitor/share
npx cap init Ardan <bundle id> --web-dir=www
node ../tools/build.mjs --out=www/index.html
npx cap add ios --packagemanager SPM   # explicit (Capacitor 8 defaults to SPM, but its SPM page still says the flag is required; Context7, 2026-11-27). SPM: ios/App/App.xcodeproj + ios/App/CapApp-SPM/Package.swift; no Podfile, no App.xcworkspace
npx cap sync ios         # after a plugin change; `npx cap copy ios` after a web change
```
Then, as text edits (no Xcode):
- `app/capacitor.config.ts`: the roadmap §4.4 sample (`webDir: 'www'`, `backgroundColor: '#14100b'`, `loggingBehavior: 'none'`,
  `ios.contentInset: 'never'`, `ios.allowsLinkPreview: false`, `SplashScreen.launchAutoHide: false`).
- `project.pbxproj`: `TARGETED_DEVICE_FAMILY = 1;` and `IPHONEOS_DEPLOYMENT_TARGET = 17.0;` in every configuration; commit a
  shared `App` scheme.
- `Info.plist`: `ITSAppUsesNonExemptEncryption` false; portrait only; remove the `~ipad` list; `UIStatusBarStyleLightContent`;
  no `UIBackgroundModes`.
- `ios/App/PrivacyInfo.xcprivacy` in the App target: no tracking, no collected data, UserDefaults `CA92.1`, FileTimestamp `C617.1`.
- `AppDelegate.swift`: `try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])`.
- `app/.gitignore`: `www/`, `node_modules/`; `ios/.gitignore` already ignores `App/App/public` and the generated config.
- The page reaches plugins as `window.Capacitor.Plugins.<Name>` (injected by the native side; no bundler), always guarded by
  `window.Capacitor && Capacitor.isNativePlatform()`, so the web build is unchanged:
  saves to `Filesystem` (`Directory.Library`, `saves/<slot>.ardan`, base64 of the gzip bytes), settings to `Preferences`
  (read all keys once at boot), export via `Filesystem` (`Directory.Cache`) + `Share.share({ files })`, `App` pause/resume,
  `SplashScreen.hide()` once `window.ARDAN_READY`, `StatusBar.setStyle({ style: 'DARK' })`.
- Icon: one 1024×1024 PNG without alpha in `AppIcon.appiconset` (`npx @capacitor/assets generate --ios` can make it).

## 5. Codemagic and TestFlight (I1-5)

The owner first: Apple Developer Program (99 USD a year); App Store Connect API access requested and a team key with the
App Manager role (Users and Access › Integrations; the `.p8` downloads once); the app record (bundle id, name, SKU); a
Codemagic account linked to GitHub with the key added (Team settings › Team integrations › Developer Portal). Never ask for
the key in chat; it goes only into Codemagic.

Then `codemagic.yaml` at the repo root (the roadmap §4.5 sample): `instance_type: mac_mini_m2`, `integrations:
app_store_connect: <key name>`, `ios_signing: { distribution_type: app_store, bundle_identifier }`, `xcode:` pinned, scripts
`node tools/build.mjs --out=app/www/index.html` → `cd app && npm ci` → `npx cap sync ios` → `xcode-project use-profiles` →
`agvtool new-version -all $(($(app-store-connect get-latest-testflight-build-number "$APP_STORE_APPLE_ID") + 1))` →
`xcode-project build-ipa --project app/ios/App/App.xcodeproj --scheme App`, publishing `app_store_connect: { auth:
integration, submit_to_testflight: true }`. No `triggering`: builds start by hand (500 free minutes a month).

On the first TestFlight build, check on the phone: the title and a new life load; the ahead-worker built the continent
(`A.V2MAP` stats) or fell back; a save survives a force-quit; Next month time; safe areas on a notched phone; no bounce or
selection; sound with the silent switch on; the score stops in the background; export opens the Share sheet.

## 6. Listing, privacy, age rating (I1-6; the owner answers, agents draft)

Name, subtitle, description, keywords (no other games' names), Games category, support URL, a **privacy policy URL**
(required; "Ardan collects nothing"), App Privacy "Data Not Collected", the age questionnaire answered from counted scenes
(frequent realistic violence gives 18+), screenshots at 1320×2868 and 1206×2622 showing play (Playwright at 440×956 and
402×874, `deviceScaleFactor: 3`). Free first; a paid app needs the owner's agreements, banking and tax.

## 7. Review (I1-7)

Reviewer notes: single-player, offline, no sign-in, all content in the app. Guard against 4.2 (feel native: no bounce,
selection, zoom or callouts; splash and status bar; system Share for export), 2.1 (no crash, no placeholder), 2.3.3
(screenshots in play), 2.5.2 (no downloaded code; mods stay data), 5.1.1 (privacy policy).

## 8. Before any online piece

Ardan is offline today. The day anything talks to a server (a leaderboard, cloud saves, a shop, accounts, an upload),
run the installed `app-abuse-checklist` skill on it before shipping: a score sent from an offline client can be any
number, a display name can carry script, a replay file is an upload. Saves stay inside `SAVES` either way.

## Checking facts

Look up Capacitor, Codemagic, Xcode and App Store tooling in **Context7** first (`resolve-library-id`, then `query-docs`;
Capacitor is `/websites/capacitorjs`), then the official page; never from memory. Context7's docs are community-indexed:
treat a surprising answer as a lead and confirm it on the official page.

## Pitfalls

- Capacitor's iOS page and Codemagic's Capacitor guide still show CocoaPods and `App.xcworkspace`: ignore for SPM.
- Xcode 27 needs Capacitor ≥ 8.5 (UIScene; 8.6.2 has it). Capacitor 9 needs Xcode 27 and iOS 16; migrate with `npx cap migrate`.
- `TARGETED_DEVICE_FAMILY "1,2"` (the template) makes iPad screenshots and iPad review mandatory.
- Never set `server.url` in a release; never trust IndexedDB or localStorage for saves on the device.
- `UI.download`'s blob link does not download in WKWebView: use Filesystem + Share.
- A build number that does not rise, an Xcode below Apple's minimum, or a missing privacy manifest reason is refused at upload.
