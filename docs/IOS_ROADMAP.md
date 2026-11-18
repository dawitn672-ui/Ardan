# The iPhone App Store route

*Written 2026-11-16 03:30 ET (owner order 62, rule 21, D-071 to D-076). Learning only: nothing in the game changed.*
*Update this file, and `.claude/skills/ios-capacitor-release/SKILL.md`, whenever something new is learned.*

Ardan ships on the Apple App Store as an iPhone app: the web game inside **Capacitor 8** (a native iOS shell around a
WKWebView), built on **Codemagic**'s cloud Mac from the GitHub repo, sent to **TestFlight**, then to **App Review**. The
owner has no Mac; nothing below needs one.

**How each claim is marked.** **[V]** read in today's official docs (link in §11, read 2026-11-16). **[R]** checked here
by running it (a command or a probe in this container, 2026-11-16). **[U]** not verified: to be checked on a real
iPhone, on Codemagic or in App Store Connect when that stage comes. Everything not marked is this repo's own code and
was read in it.

Contents: §1 the owner's six facts · §2 what else is true now · §3 the route at a glance · §4 the seven stages ·
§5 the one-file build in WKWebView · §6 what only the owner can do · §7 where Ardan stands against each build rule ·
§8 the fixes, in order · §9 the build rules (copied from order 62) · §10 pitfalls · §11 sources.

## 1. The owner's six facts, re-checked

| # | The owner's fact | Verdict | What is true (2026-11-16) |
| --- | --- | --- | --- |
| 1 | Capacitor 8 is current; Node 22+; Swift Package Manager by default, so the iOS project is `ios/App/App.xcodeproj` (no Podfile, no `.xcworkspace`) | **Confirmed**, with one addition | [V] "Capacitor 8 requires NodeJS 22 or greater", "Xcode 26.0+", iOS 15 deployment target, "Capacitor CLI now creates iOS SPM projects as default" (updating/8-0). [R] npm: `@capacitor/cli` **8.6.2** (2026-11-13, `engines.node >=22.0.0`), `next` is `9.0.0-rc.0`. [R] `npx cap add ios` on this Linux box made `ios/App/App.xcodeproj` and `ios/App/CapApp-SPM/Package.swift`, no Podfile, no top-level `App.xcworkspace` (only the one Xcode keeps inside every `.xcodeproj`). **Addition:** Capacitor **8.5** (2026-07-31) is a breaking minor that adopts UIScene because **Xcode 27 requires it**; 8.6.2 already has `SceneDelegate.swift`. The capacitorjs.com iOS page still says `open ios/App/App.xcworkspace`: that line is stale (it predates SPM by default). **Capacitor 9** is in release candidate, "towards the end of the year" [V]; its guide asks for Xcode 27 and iOS 16 [V, docs/next]. |
| 2 | Since 28 April 2026 Apple only accepts uploads built with Xcode 26+ and the iOS 26 SDK | **Confirmed** | [V] Apple news 2026-02-03 and Upcoming Requirements: "Since April 28, 2026 … must be built with Xcode 26 or later using an SDK for iOS 26". No Xcode 27 deadline is posted yet; by Apple's yearly pattern one may come for spring 2027 [U]. Also posted: since 2026-09-09 apps must target iOS 13 or later (Capacitor's 15 is above it). |
| 3 | Ionic Appflow is closed to new customers and shuts down at the end of 2027; Expo EAS Build is for React Native | **Confirmed** (Appflow); **nuance** (EAS) | [V] Ionic, 2025-02-11: "we have discontinued new customer sales for all Ionic commercial products" and "You'll continue to have access through December 31, 2027". [V] EAS Build "builds app binaries … for your Expo and React Native projects" but "is also designed to work for any native project". It documents nothing for Capacitor and its tooling is built around Expo; the conclusion (do not plan around it) stands. |
| 4 | Web Audio on iOS is muted by the silent switch unless `navigator.audioSession.type = 'playback'`; sound unlocks only after the first tap | **Confirmed in Safari**; WKWebView **unverified** | [V] WebKit bug 237322: Web Audio is muted by the ringer switch while `<audio>` plays; a WebKit engineer (2024-09-25): "Since iOS 17" the type can be set to "playback"; the default "ambient" mutes. [V] MDN: `"playback"` is exclusive (pauses other playback), `"ambient"` mixes. [U] whether the property exists and behaves the same inside a Capacitor WKWebView, whose audio session the app owns: set the native `AVAudioSession` category too (§4.4). Unlock on a gesture: the game already starts music on the first `pointerdown` (`src/ui/73-music-score/music.core.js:487`). [R] Playwright's Linux WebKit has no `navigator.audioSession` (expected: it is an Apple-platform feature). |
| 5 | iOS can clear WebView localStorage; real saves go through `@capacitor/preferences` or `@capacitor/filesystem` | **Confirmed**, refined | [V] Capacitor storage guide: localStorage "must be considered transient … the OS will reclaim local storage from Web Views if a device is running low on space", and "The same can be said for IndexedDB at least on iOS". [V] Preferences is UserDefaults, for "lightweight data" and "not meant to be used as a local database". Ardan's saves are 300 to 840 KB gzipped each, four slots ([R], `tests/saves/press/`): **saves go to Filesystem, settings to Preferences** (D-075). |
| 6 | Apple rejects apps that feel like a website (4.2); the app must work fully offline and must not allow text selection, zoom or page bounce | **4.2 confirmed**; the rest is **practice, not guideline text** | [V] 4.2: "Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store." The guidelines do not mention offline, text selection, zoom or bounce; those are what makes a WebView app feel native and avoid 4.2, and we keep them as rules. Related: 2.5.2 (self-contained, may not download code that changes features), 4.2.3(ii) (disclose any download needed at first launch). |

## 2. What else is true now (read or run 2026-11-16)

- **Codemagic** [V]: Xcode 26.0 to 26.6 (26.6 the default) and 27.0 to 27.3 (27.3 edge) on its Macs; the 26.6 image runs macOS
  26.5.1 with Node 24.17.0 and CocoaPods 1.16.2. Machines: Mac mini M2 (8-core, 12 GB) and M4 (M4 needs billing). **Free
  plan: 500 macOS M2 minutes a month**, then $0.095 a minute. `codemagic.yaml` lives at the repo root; with no
  `triggering` events a workflow runs only when started by hand. Publishing's post-processing uses no build minutes.
- **Codemagic's Capacitor guide** [V] still shows a CocoaPods project (`pod install`, `--workspace`); for SPM, its CLI's
  `xcode-project build-ipa` takes `--project` ("Path to Xcode project (*.xcodeproj)") [V].
- **The SPM template** [R]: `IPHONEOS_DEPLOYMENT_TARGET = 15.0`, `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone and iPad),
  landscape allowed, `UIRequiredDeviceCapabilities armv7`, `SceneDelegate.swift` already there; `CapApp-SPM/Package.swift`
  pins `capacitor-swift-pm` exactly and points at each plugin in `node_modules` by relative path; `ios/.gitignore`
  ignores `App/App/public` (the copied web build) and the generated `capacitor.config.json`. `npx cap add ios` and
  `npx cap sync ios` run on Linux: the whole native project can be made and committed from this container.
- **No bundler needed for plugins** [R]: Capacitor's native side injects `window.Capacitor.Plugins.<Name>` for each
  installed plugin as a WKUserScript at document start (`@capacitor/ios/Capacitor/Capacitor/JSExport.swift`), so the
  one-file page can call `window.Capacitor.Plugins.Filesystem.writeFile(...)` without importing `@capacitor/core`.
- **Plugins** [R] (npm, 2026-11-16): preferences 8.0.1, filesystem 8.1.5, app 8.1.2, splash-screen 8.0.2, status-bar
  8.0.4, haptics 8.0.2, share 8.0.3; all ship a `Package.swift`.
- **Privacy manifest** [V]: Filesystem needs `NSPrivacyAccessedAPICategoryFileTimestamp` reason `C617.1`; Preferences
  needs `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1`, in `ios/App/PrivacyInfo.xcprivacy`.
- **App privacy** [V]: data processed only on the device is not "collected"; a **privacy policy URL is required**.
- **Age rating** [V]: tiers 4+, 9+, 13+, 16+, 18+; realistic violence infrequent 13+, frequent 18+; alcohol references
  infrequent 13+, frequent 18+; mature or suggestive themes (including "war or political strife") infrequent 9+,
  frequent 16+; simulated gambling infrequent 13+, frequent 18+ (Australia shows R 18+ for any simulated gambling).
- **Screenshots** [V]: at least one for the iPhone with Dynamic Island (medium display, 1206 × 2622 or 1179 × 2556) and a
  large set (1320 × 2868, 1290 × 2796 or 1260 × 2736; or Face ID large 1284 × 2778 / 1242 × 2688); 1 to 10 per size,
  no alpha; smaller sizes are scaled from the largest.
- **TestFlight** [V]: up to 100 internal testers (team members with a role), up to 10,000 external; external testing needs
  the first build approved by Beta App Review.
- **The developer account** [V]: 99 USD a year; an individual enrolls with an Apple Account with two-factor
  authentication and sells under his legal name; an organization needs a D-U-N-S number. Enrollment can be done on the
  web or in the Apple Developer app (no Mac).

## 3. The route at a glance

| Stage | One line | Who | Folds into |
| --- | --- | --- | --- |
| 1 Performance | Load and Next month inside a phone budget at 4 to 6x CPU; no growth without bound; no allocations in draw loops | agents | X7 part 2, X5, D12b-1 |
| 2 iPhone readiness | Safe areas live (`viewport-fit=cover`), dvh, 44-pt targets, no selection or bounce, one AudioContext with a session, saves behind a backend switch | agents | I1-2, Gaps |
| 3 `www/` build | `tools/build.mjs` writes the same one-file page to `app/www/index.html`; the split variant only if the iPhone says so | agents | I1-3 |
| 4 Capacitor setup | `app/` holds `package.json`, `capacitor.config.ts`, the SPM `ios/` project made on Linux, Info.plist keys, the privacy manifest | agents (owner: bundle id) | I1-4 |
| 5 Codemagic and TestFlight | `codemagic.yaml` at the root: build, sign automatically with the API key, upload to TestFlight | owner sets up, agents write | I1-5 |
| 6 Listing, privacy, age rating | App record, name, screenshots, privacy policy page, "Data Not Collected", age questionnaire, export compliance | owner | I1-6 |
| 7 Review | Notes for the reviewer, an offline game with no login; answer 4.2 by being app-like | owner submits | I1-7 |

## 4. The stages

### 4.1 Stage 1: performance

**Steps.**
1. Hold today's phone numbers and set a budget for the iPhone. X7 part 1 (`tools/bench/reports/phone-after.md`, H-043) measured,
   as a Pixel 7 at 1x / 4x / 6x CPU: load to the first Life screen 3.2 / 11.8 / 18.4 s; Next month at year 0 about
   0.3 / 1.3 / 2.1 to 2.7 s. Half of a press is the engine's month (the war sim), which X7 part 2 and D12b-1 own.
   Proposed budget on a 4x run (a recent iPhone's single core is faster than that; to be measured, [U]): title under 3 s,
   first Life screen under 6 s, Next month under 1 s at year 0 and year 50.
2. **Map draws** (rule: one draw a change, no new objects in a frame loop): coalesce the pan redraw to one draw a frame and
   take the allocations out of the draw loops (§7.8).
3. **State diet** (rule: no data that grows forever): cap or compact what grows with years (§7.10). X5 owns it.
4. Memory: two tile caches of up to 150 and 140 bitmaps of 256 × 256 (up to ~73 MB) plus a kept view per canvas. Measure on
   the device (Safari's Web Inspector against a debug build, `ios.webContentsDebuggingEnabled: true`) [U].

**Commands.**
```sh
node tools/build.mjs --out=/tmp/ardan/i1/x.html
node tools/bench/phone-load.mjs /tmp/ardan/i1/x.html --runs=3 --profile --out=/tmp/ardan/i1
node tools/bench/next-month-speed.mjs /tmp/ardan/i1/x.html --save=tests/saves/press/y50-noble.ardan --throttle=4
node tools/bench/press-gate.mjs /tmp/ardan/i1/x.html
```

**Only the owner:** nothing. **Pitfalls:** Chromium's 4x throttle is not an iPhone; the first TestFlight build is the real
measure. A WKWebView whose page uses too much memory is killed and reloads as a blank white page ([U], a known WebKit
behaviour): watch for it on old devices.

### 4.2 Stage 2: iPhone readiness

**Steps** (each is an item in §8 with its file and line):
1. **Viewport.** `src/core/release/page.html:6` becomes
   `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Without `viewport-fit=cover`
   every `env(safe-area-inset-*)` in the game is 0 and its 14 safe-area paddings do nothing. Zoom: a native WebView app may
   also add `maximum-scale=1, user-scalable=no` (WKWebView honours it unless the app sets `ignoresViewportScaleLimits`;
   Safari ignores it) [U on device]; text stays readable by the game's own text-size setting.
2. **No selection, callout or bounce** (one rule block in the base look):
   `html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}`
   and `input,textarea,[contenteditable]{-webkit-user-select:text;user-select:text}`; Capacitor's `ios.allowsLinkPreview: false`.
   If `overscroll-behavior:none` does not stop the rubber band in WKWebView [U], set `ios.scrollEnabled: false` and let
   `#app` be the scroller (`height:100dvh;overflow:auto`).
3. **dvh.** Replace the 50 `vh` uses with `dvh`, keeping a `vh` line before each for iOS 15.0 to 15.3 (or set the
   deployment target to 17, D-075, where `dvh` is always there).
4. **Safe areas** on every fixed bar and sheet, in both layouts (the desktop layout shows on a landscape iPhone wider
   than 760 px; portrait only removes that case, D-075).
5. **Touch.** 44-pt targets (§7.2); `pointercancel` on every drag; `:hover` styles inside `@media (hover:hover)` so a tap
   does not leave a button lit.
6. **Audio.** One AudioContext for music and sound, unlocked on the first tap, suspended on `visibilitychange`/`pause`,
   resumed on `resume`; `navigator.audioSession.type = 'playback'` while sound or music is on (D-075); the native session
   set in the shell (§4.4).
7. **Saves.** `SAVES` gets one switch underneath (`SAVES.backend`: `idb` | `local` | `native`); the rest of the game does
   not change. Settings: everything through `UI.store` (profile-tab's four direct `localStorage` calls move to it), and
   `UI.store` gets the same switch (Preferences under it). Export through `UI.download` (one funnel, six callers) becomes
   Filesystem + Share on the device.
8. **App lifecycle.** Save on `App` `pause` (the game already saves on `visibilitychange`,
   `src/core/release/core/23-ui-a.js:2307`); iOS gives a backgrounded app only a few seconds [U], so the save must not wait
   on anything slow.

**Only the owner:** nothing. **Pitfalls:** test at 375 × 667 (iPhone SE 2nd and 3rd gen), 390 × 844, 393 × 852 and 440 × 956
(Pro Max), in both Chromium and WebKit: `docs/research/ios/tap-probe.mjs --engine=webkit`.

### 4.3 Stage 3: a self-contained `www/` build

**Steps.**
1. The build writes the one file where Capacitor reads it: `node tools/build.mjs --out=app/www/index.html` (no new tool is
   needed for the first version; a `--www` flag or `tools/build-www.mjs` may follow if the split variant is chosen).
2. The page keeps relative paths only; it has no `http(s)://`, no root-relative path, no CDN, no web font from the net
   (fonts are `data:` woff2, `page.html:10-21`), and its CSP (`page.html:5`) has `default-src 'none'`, so nothing can reach
   the network even by mistake.
3. `app/www/` is ignored by git; Codemagic builds it.

**Recommendation** (D-075): ship the **one file** first, as it is today; measure on a TestFlight build; build the split
variant only if the measured load misses the budget. §5 gives the reasons and the CSP and worker answer.

**Only the owner:** nothing. **Pitfalls:** `npx cap copy` adds empty `cordova.js` and `cordova_plugins.js` beside the page [R];
harmless. Never point `server.url` at a web address in a release build (a remote page is the classic 4.2 and 2.5.2
rejection).

### 4.4 Stage 4: Capacitor setup

**Where it lives** (D-075): `app/` at the repo root, a Capacitor project of its own (`app/package.json`,
`app/capacitor.config.ts`, `app/ios/`, `app/www/` ignored). The game's own `package.json`, CI and tests are untouched;
`Package.swift` points at `app/node_modules/...` by relative path, so `node_modules` must sit beside `capacitor.config.ts`.

**Commands** (all run on Linux [R]):
```sh
mkdir -p app/www && cd app
npm init -y
npm i -D @capacitor/cli@^8.6
npm i @capacitor/core@^8.6 @capacitor/ios@^8.6 @capacitor/app @capacitor/filesystem @capacitor/preferences \
      @capacitor/splash-screen @capacitor/status-bar @capacitor/haptics @capacitor/share
npx cap init Ardan <bundle id from the owner> --web-dir=www
node ../tools/build.mjs --out=www/index.html
npx cap add ios                 # SPM by default: ios/App/App.xcodeproj, ios/App/CapApp-SPM/Package.swift
npx cap sync ios                # after every plugin change; npx cap copy ios after a web-only change
```

**`app/capacitor.config.ts`** (sample):
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.ardan',          // the owner's bundle id; it cannot change after the first upload
  appName: 'Ardan',
  webDir: 'www',
  backgroundColor: '#14100b',          // the boot screen's colour (page.html .boot), so no white flash
  loggingBehavior: 'none',             // 'debug' only in a debug build
  ios: {
    contentInset: 'never',             // the default: the page pads itself with env(safe-area-inset-*)
    allowsLinkPreview: false,          // no long-press previews
    backgroundColor: '#14100b',
    preferredContentMode: 'mobile',
    webContentsDebuggingEnabled: false // true in a debug build, for Safari's Web Inspector
    // scrollEnabled: false            // only if CSS cannot stop the bounce (4.2, step 2)
  },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#14100b', showSpinner: false },
  },
};

export default config;
```
Server defaults stay (`iosScheme: 'capacitor'`, `hostname: 'localhost'`) [V]: the page's origin is `capacitor://localhost`.

**Project settings** (edited as text, no Xcode needed; [R] lines in `project.pbxproj`):
- `TARGETED_DEVICE_FAMILY = 1;` (iPhone only, D-075) in both App target configurations.
- `IPHONEOS_DEPLOYMENT_TARGET = 17.0;` (D-075) in the project and target configurations.
- `MARKETING_VERSION` (the shown version, e.g. `1.0.0`) by hand; `CURRENT_PROJECT_VERSION` set by Codemagic each build.
- A shared scheme `App` (`ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme`) committed, so `xcodebuild` finds it on a
  fresh clone (the Linux-made project has none [R]; Xcode makes one on open, `xcodebuild -list` on Codemagic shows it) [U].

**`ios/App/App/Info.plist`** keys to add or change:
```xml
<key>ITSAppUsesNonExemptEncryption</key><false/>      <!-- no encryption of our own: skips the export question per build -->
<key>UISupportedInterfaceOrientations</key>
<array><string>UIInterfaceOrientationPortrait</string></array>   <!-- portrait only (D-075) -->
<key>UIStatusBarStyle</key><string>UIStatusBarStyleLightContent</string>
<key>UIViewControllerBasedStatusBarAppearance</key><true/>        <!-- already true; the StatusBar plugin needs it [V] -->
```
Remove the `~ipad` orientation list with the iPad family. Add no `UIBackgroundModes` (the score stops in the background, rule).
`UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace` only if saves should show in the Files app [V]; they need not
(export goes through the Share sheet).

**`ios/App/PrivacyInfo.xcprivacy`** (added to the App target; reasons [V]):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key><array/>
  <key>NSPrivacyAccessedAPITypes</key><array>
    <dict><key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key><array><string>CA92.1</string></array></dict>
    <dict><key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key><array><string>C617.1</string></array></dict>
  </array>
</dict></plist>
```
Adding a file to the target means editing `project.pbxproj` (a PBXFileReference, a PBXBuildFile in Resources); do it with a
small script and check the build on Codemagic [U].

**The audio session in the shell** (belt and braces for fact 4; [U] until heard on a device): a subclass of
`CAPBridgeViewController` set in `SceneDelegate.swift` (the template makes `CAPBridgeViewController()` there [R]) or two
lines in `AppDelegate.application(_:didFinishLaunchingWithOptions:)`:
```swift
import AVFoundation
try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
```

**The page's side** (guarded, so the web build is unchanged; a sketch for I1-2):
```js
const CAP = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor.Plugins : null;
// SAVES.backend = 'native': each slot a file under Directory.Library, 'saves/<slot>.ardan', the gzip bytes as base64
// UI.store -> Preferences (async under a sync face: read all keys once at boot into a Map, write through)
// UI.download -> Filesystem.writeFile(Directory.Cache) then Share.share({ files: [uri] })
// App.addListener('pause', ...) -> UI.save(true), music suspend;  'resume' -> resume
// SplashScreen.hide() once window.ARDAN_READY;  StatusBar.setStyle({ style: 'DARK' }) (light text)
```

**Icons and launch screen.** One 1024 × 1024 PNG app icon (no alpha) in `ios/App/App/Assets.xcassets/AppIcon.appiconset`;
the launch screen is the template's `LaunchScreen.storyboard` with the `Splash` image set; `npx @capacitor/assets generate --ios`
makes both from `assets/icon.png` and `assets/splash.png` [U, not re-read].

**Only the owner:** the **bundle id** (reverse domain he controls or chooses, e.g. `com.<name>.ardan`; it is permanent once
uploaded) and the app's **name** on the Home Screen.

**Pitfalls:** `npx cap add ios --packagemanager CocoaPods` is the old way: do not mix; a plugin without `Package.swift` breaks
SPM [V]; `TARGETED_DEVICE_FAMILY "1,2"` (the template) would make iPad screenshots and iPad review mandatory; the stale iOS
doc's `App.xcworkspace` does not exist in an SPM project; after Xcode 27 becomes required, Capacitor must be at least 8.5
(UIScene, already in 8.6.2).

### 4.5 Stage 5: Codemagic signing and TestFlight

**Steps.**
1. The owner connects the GitHub repo in Codemagic (personal account, free plan), adds the **App Store Connect API key**
   under Team settings › Team integrations › Developer Portal › Manage keys (name, Issuer ID, Key ID, the `.p8`) [V].
2. Codemagic makes the distribution certificate and the App Store profile itself when `ios_signing` names the
   distribution type and the bundle id; certificates it did not make must be uploaded (`.p12`) [V].
3. Agents write `codemagic.yaml` at the repo root. Builds start by hand (no `triggering`), so the 500 free minutes go on
   builds someone wanted; a build of this size should take well under 15 minutes [U].
4. A build that passes uploads to App Store Connect and, after processing, appears in TestFlight. Internal testers (the
   owner) need no Beta App Review; external testers do [V].

**`codemagic.yaml`** (sample for a Capacitor 8 SPM project in `app/`):
```yaml
workflows:
  ios-testflight:
    name: iOS to TestFlight
    instance_type: mac_mini_m2          # the free plan's machine
    max_build_duration: 45
    integrations:
      app_store_connect: Ardan ASC key  # the name the owner gave the API key in Codemagic
    environment:
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.example.ardan     # the owner's bundle id
      vars:
        APP_STORE_APPLE_ID: 0000000000           # App Store Connect > the app > App Information > Apple ID
        XCODE_PROJECT: app/ios/App/App.xcodeproj
        XCODE_SCHEME: App
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1      # the game's devDependencies need no browser here
      node: 22
      xcode: 26.6                                # pin; move to 27.x deliberately (Capacitor >= 8.5 is ready for it)
    scripts:
      - name: Build the game into app/www
        script: node tools/build.mjs --out=app/www/index.html
      - name: Install the shell's packages
        script: cd app && npm ci
      - name: Copy the page and resolve the Swift packages
        script: cd app && npx cap sync ios
      - name: Signing files onto the project
        script: xcode-project use-profiles
      - name: Build number one above TestFlight's
        script: |
          cd $CM_BUILD_DIR/app/ios/App
          LATEST=$(app-store-connect get-latest-testflight-build-number "$APP_STORE_APPLE_ID")
          agvtool new-version -all $(($LATEST + 1))
      - name: Build the ipa
        script: xcode-project build-ipa --project "$XCODE_PROJECT" --scheme "$XCODE_SCHEME"
    artifacts:
      - build/ios/ipa/*.ipa
      - /tmp/xcodebuild_logs/*.log
    publishing:
      app_store_connect:
        auth: integration
        submit_to_testflight: true
        submit_to_app_store: false
```
Keys and commands from Codemagic's docs [V] (`instance_type`, `integrations`, `ios_signing`, `xcode-project use-profiles`,
`build-ipa --project`, `get-latest-testflight-build-number`, `publishing.app_store_connect`); the whole file is [U] until the first
green build. `agvtool` needs `CURRENT_PROJECT_VERSION` set and "Apple Generic" versioning in the project [U].

**Only the owner:** the Apple Developer Program (99 USD a year) [V]; asking for App Store Connect API access as Account Holder
("reviewed and approved on a case-by-case basis") and making a **team key** with the App Manager role, downloading the `.p8`
once [V]; the **app record** in App Store Connect (My Apps › +, name, bundle id, SKU, primary language) before the first
upload [V]; the Codemagic account and its link to GitHub; installing TestFlight on his iPhone.

**Pitfalls:** Codemagic "recommends" uploading the very first version by hand [V], which needs a Mac: try the automated
upload first; if App Store Connect refuses it, its message says why [U]. The `.p8` cannot be downloaded twice. A build
number that does not rise is refused. An `ipa` built with an older Xcode than Apple's minimum is refused at upload (fact 2).
`testFlightInternalTestingOnly` builds (a `use-profiles` option) can never go to external testers or the store [V].

### 4.6 Stage 6: App Store listing, privacy and age rating

**Steps** (App Store Connect, all the owner's, agents draft the words):
1. **Name** (30 characters), subtitle, description, keywords (no trademarks or other games' names, 2.3.7 [V]), category
   Games › Role Playing (or Simulation), support URL, **privacy policy URL** (required [V]; a short page on GitHub Pages:
   "Ardan collects nothing; the game and its saves stay on your device").
2. **App Privacy:** "Data Not Collected" (nothing leaves the device; data processed only on the device is not collected [V]).
   The privacy manifest says the same (§4.4).
3. **Age rating questionnaire** [V]: answer honestly from the content. Ardan has war and duels (realistic violence),
   taverns and drink, courtship and lovers, intrigue, executions and "war or political strife", and some dice and gambling
   scenes. "Frequent" realistic violence gives **18+**; if violence is judged "Infrequent", the result is likely 13+ or 16+
   (frequent mature themes give 16+). Agents will count the scenes when the stage comes; the owner answers.
4. **Screenshots:** 3 to 10 portrait shots at 1320 × 2868 (6.9-inch class) and at 1206 × 2622 (medium); they must show the
   app in use, not the title art (2.3.3 [V]). Agents can make them with Playwright at 440 × 956 and 402 × 874 points and
   `deviceScaleFactor: 3` from the real build [U for exact pixel match]; the owner approves.
5. **Export compliance:** answered once by `ITSAppUsesNonExemptEncryption = NO` in Info.plist [V for the key's purpose;
   Apple's page was not readable, the key name is from Capacitor and App Store practice, U].
6. **Price:** free first. A paid app or in-app purchases need the **Paid Apps agreement, banking and tax forms** in App
   Store Connect › Business (the owner only) [U, not re-read].

### 4.7 Stage 7: review

**Steps.** Fill App Review Information: no sign-in needed; a note: "Ardan is a single-player, offline life and strategy
game. All content is in the app; it makes no network requests." Submit the TestFlight build for review; answer any
rejection in Resolution Center.

**What review checks that matters to us** [V]: 2.1 completeness (no placeholders, no crash on launch); 2.3.3 screenshots
in use; 2.5.2 self-contained, no downloaded code (mods are data files checked by `A.MODC`, `src/core/65-mods/`; keep it
so); 4.2 app-like and lasting entertainment; 5.1.1 privacy policy. **4.2 defence:** offline from the first launch,
native splash and status bar, no bounce, no selection, no zoom, no long-press callouts, haptics on choices (optional),
saves and export through the system, portrait layout made for the phone, no visible web chrome or links out.

## 5. The one-file `index.html` in WKWebView, and `www/` one file or split

**What the page does at boot** (`src/core/release/page.html`): three `<script type="text/plain">` blobs (core, content,
lore) packed as 7-bit text of zstd data; an inline loader decodes and decompresses them (fzstd) and runs each as a new
`<script>` whose `textContent` is the code; the CSP allows inline scripts by hash with `'strict-dynamic'`, so scripts the
loader makes are trusted. The new life's continent is built ahead in a **worker made from a blob URL**
(`src/map/99991-v2-map/e-ahead.core.js:53`), allowed by `worker-src blob:`.

**Checked here** [R] (`docs/research/ios/webkit-boot.mjs`, Playwright 1.63's Linux WebKit, `file://`, 375 × 667, on a loaded
4-core box): the page booted with no CSP report and no error; a blob worker under the page's CSP answered; `A.V2_MAKE`
was there for the ahead-worker; IndexedDB, CompressionStream and Web Locks were present; a new life saved (345 KB, IDB).
Boot marks: core ran 1.3 s, title shown 1.33 s, event packs in 9.6 s (the box was at load 12, so read only the order).

**Under `capacitor://localhost`** [U]: CSP is the same mechanism whatever the scheme; a `blob:` URL made by the page has
the page's origin; dedicated workers from blob URLs are supported by WebKit. What is known not to work on the custom
scheme is **service workers** (not used) and **navigating to a blob URL to download** (Capacitor issue 5478: affects
`UI.download`, replaced on the device by Filesystem + Share, §4.4). Capacitor's own scripts are WKUserScripts and its
bridge is `window.webkit.messageHandlers`, neither of which the page's CSP governs. **Risk is low either way:** the
ahead-worker already falls back to building on the main thread when a worker will not start (`e-ahead.core.js:67`,
`wk.onerror` → `stop()`), so the worst case is a slower first life, never a broken one. The first TestFlight build checks
it (`A.V2MAP` ahead stats: `H.built`, `H.failed`).

**One file or split.**

| | One file (today's `index.html`) | Split (`index.html`, `js/core.js`, `js/pack-NN.js`, `lore.json`, `js/map-worker.js`) |
| --- | --- | --- |
| Works now | Yes, CI-tested; booted in WebKit [R] | Needs a new build path and a new CSP (`script-src 'self'`, `worker-src 'self'`) |
| Boot cost | Decode + zstd every launch (core ~0.5 s in WebKit here [R]; more on a phone) | None: the app bundle is on the device's disk, compression buys nothing |
| JS parse | Scripts from `textContent`: WebKit's bytecode cache may not keep them [U] | Scripts from same-origin files: cacheable [U] |
| Worker | blob URL (fallback exists) | a real file: no blob question |
| Web build | the same file | a second artifact to keep in step |

**Recommendation** (D-075): stage 3 ships the **one file** unchanged; the first TestFlight build measures load on a real
iPhone; the split build is made only if that misses the budget. **To keep the split open from today:** load nothing by
absolute path, keep the three blobs independent (they are), keep the worker's source a function of the page (it is),
and never assume `file://` or `http(s)://`.

## 6. What only the owner can do, and when

| When | What | Cost |
| --- | --- | --- |
| Before stage 5 (a few weeks ahead: enrollment can take days [U]) | Enroll in the Apple Developer Program as an individual (Apple Account with two-factor), on the web or the Apple Developer app | 99 USD a year |
| Stage 4 | Choose the **bundle id** and the app's name (permanent once uploaded) | none |
| Stage 5 | Request App Store Connect API access (Account Holder), make a team key with App Manager access, keep the `.p8` | none |
| Stage 5 | Create the **app record** in App Store Connect (name, bundle id, SKU, language) | none |
| Stage 5 | Make a Codemagic account, connect GitHub, add the API key as an integration; start the first build | free 500 min a month |
| Stage 5 | Install TestFlight on his iPhone; play the build | none |
| Stage 6 | Approve name, description, keywords and screenshots; publish the privacy policy page; answer App Privacy and the age questionnaire; set the price | none (paid: banking and tax forms) |
| Stage 7 | Submit for review; answer the reviewer | none |

The agents can do everything else: the code, the `app/` shell (made on Linux), `codemagic.yaml`, the words, the
screenshots, and a checklist for each of his steps. Secrets never go into the repo or the chat: the `.p8` goes only into
Codemagic.

## 7. Where Ardan stands today against each build rule

Audit of `origin/v2-integration` at `044436b` (built to `/tmp`, 133 features, 5,378 KB). Counts are from `grep` over `src/`
(the engine's ES modules excluded) and from the two probes in `docs/research/ios/`.

> **After I1-2 (H-074, branch `i1-2`):** items below marked **[I1-2 done]** are fixed; the counts in the headings are the ones the audit found. What is left is in §8's last column.

### 7.1 Input: pointer events only; nothing on hover, right-click, double-click or keys
- **Good.** No `mousedown/up/move`, no `touchstart/move/end` and no `dblclick` anywhere; the maps drag with pointer events
  (`src/core/release/core/23-ui-c.js:1273-1284`, `23-ui-d.js:1130-1146`, `src/map/9991-atlas-of-known-places/atlas.core.js:374-381`,
  `src/war/85-battle-labels/m-field.core.js:122`); two-finger pinch on the phone (`src/ui/71-phone/phone.core.js:389-417`);
  descriptions open on click (`src/ui/59-descriptions`).
- **`pointercancel` missing on 4 drags** (only the pinch has it, `phone.core.js:416`): `23-ui-c.js:1273`, `23-ui-d.js:1130`,
  `atlas.core.js:374`, `m-field.core.js:122`. iOS cancels a pointer for system gestures; the drag then sticks.
- **Hover:** 3 mouse-hover listeners, none load-bearing: `23-ui-b.js:24` (dead: `UI.tipsInit` is replaced by
  `descriptions.engine.core.js:313`; archive it), `src/map/62-inked-map/z-hover.core.js:38` (a realm outline under a
  mouse; never fires on touch), `src/ui/96-big-moments/toasts.core.js:75` (holds a toast; `focusin` does the same).
  **57 CSS `:hover` rules** (e.g. `src/ui/91-visual-style/look.b-base.core.js:159`, `page.html:23`) are cosmetic but stick
  after a tap on iOS: wrap them in `@media (hover:hover)`.
- **Right-click:** one, the war map's order (`23-ui-d.js:1196`); a tap gives the same order (`23-ui-d.js:1230`, `1268`). Keep.
- **Keys:** 13 `keydown` listeners; each read is a shortcut beside a button (zoom `+`/`-` beside `gmZoom`/`wrZoom`,
  `23-ui-c.js:1049`, `23-ui-d.js:2167`; the clock `src/ui/84-top-bar/step.core.js:278`, `src/core/99992-v2-time/time.core.js:445`;
  Esc beside each close). **No keyboard-only path found.** Wheel zoom (`23-ui-c.js:1348`, `23-ui-d.js:1190`, `atlas.core.js:386`)
  has buttons and pinch.

### 7.2 Tap targets of 44 points
**[After merging v2.1.0-alpha.10 (S1 skills, R2): 0 of 454 under 44 points, the skills rows, the skills sheet, the person view and R2's "out of reach" line included (its "why not" button was 44 already); `tapTargets44` holds it with no exception.]** **[I1-2 done: 58 of 382 under 44 points before, 10 of 385 after, in Chromium; WebKit 10 too. The 10 are the skills rows (`div.prow` 5 on the You page, `li.tt.pf-sk` 5 on the Profile page): S1b's new skills page owns them. `src/ui/9990-tap-targets` (a hit box or a 44-point reach that leaves the line where it was; the probe counts a `::after` hit box; `tapTargets44` holds it at 0 but the skills rows).]** [R] `docs/research/ios/tap-probe.mjs` at 375 × 667, a noble's life, the title, 13 pages and an event card, the same in Chromium
and WebKit: **58 of 382 controls are under 44 points (15%)**; of those in view without scrolling, 17 of 273 (6%). By page:
**You 29 of 55**, Profile 12 of 32, Path 6 of 39, Holdings 6 of 35, Dynasty 3 of 24, Life 1, Realm 1; the title, Story,
Decisions, Arms, People, World, Book and the event card have none. The small ones are short, not narrow: `span.tt` and
`li.tt` description words (17 + 5, 24 px tall), `div.v2-row` stat rows (12, 41 px), `span.chip` (7, 24 px), `div.prow` (5,
29 px), `span.tt-n` (4, 25 px), bold path links (5, 24 px). **No page scrolls sideways at 375.** The fix is a taller hit
area (padding or an `::after` hit box), not bigger type.

### 7.3 Layout: 375 × 667 to Pro Max; safe areas; dvh
- **[I1-2 done]** `viewport-fit=cover` is on; the 14 safe-area paddings now see the real insets (Playwright cannot fake them: look at them in TestFlight). 375×667 and 393×852: no page scrolls sideways.
- **Viewport** (`page.html:6`): `width=device-width, initial-scale=1`, **no `viewport-fit=cover`**: every `env(safe-area-inset-*)`
  is 0 today. There are **14 safe-area paddings** (`phone.core.js:42, 48, 73, 180, 183, 199, 228, 239`;
  `toasts.core.js:86`; `src/ui/92-scene-card/scene.d-style.core.js:176, 210, 211`; `src/events/29-starting-stories/starts.core.js:265`;
  `page.html:23` three times), all in the phone layout (`max-width:760px`); the desktop layout has none.
- **[I1-2 done]** all 49 CSS uses became `dvh`, each with the `vh` line kept before it as a fallback (the 50th was a comment in `c-draw.core.js`). **`vh`: 50 uses in 13 files, `dvh`: 0** (as audited) (`page.html` 20, `endings.core.js` 7, `look.g-title.core.js` 7, `look.c-layout.core.js` 3,
  `scene.d-style.core.js` 3, `phone.core.js` 2, `86-title-screen-in-view/fold.core.js` 2, one each in `23-ui-b.js`, `atlas.core.js`,
  `c-draw.core.js`, `identity.a-mark.core.js`, `skies.core.js`, `share.core.js`). In a Capacitor app there is no browser bar, so
  `vh` and `dvh` differ less than in Safari, but the rule stands.
- **[I1-2 done]** `html, body{overscroll-behavior:none; touch-action:manipulation; -webkit-tap-highlight-color:transparent}`, `body{user-select:none; -webkit-touch-callout:none}`, selection allowed again on inputs, textareas, selects, `[contenteditable]` and `.selectable`; no `maximum-scale` (pinch zoom stays for accessibility; `touch-action:manipulation` stops the double-tap zoom). Probe: `select none touch manipulation overscroll none` on every page.
- **Selection, callout, bounce** [R]: `body` computes `user-select: auto`, `touch-action: auto`, `overscroll-behavior: auto`:
  text can be selected and the page bounces. `#gmap, #warmap` have `touch-action:none` (`page.html:23`), the atlas canvas too
  (`atlas.core.js:453`). `-webkit-touch-callout` and a global `-webkit-tap-highlight-color` are absent.
- 375-wide pages fit (no sideways scroll [R]). The 760 px phone switch covers every iPhone in portrait (Pro Max is 440).

### 7.4 Assets: relative paths, offline, no network
- **Good.** No `http(s)://` in `src/` or `data/` (except the SVG namespace); no root-relative `src="/"`; no `fetch`, XHR,
  WebSocket, EventSource or `sendBeacon`; fonts are inline `data:` woff2 (`page.html:10-21`, `src/ui/77-offline-fonts`); the CSP
  (`page.html:5`) is `default-src 'none'` with `connect-src data: blob:`. The page works offline as one file today.
- **[I1-2 done]** `UI.download` has a guarded native hook: inside Capacitor (`window.Capacitor`) it calls `UI.nativeDownload(bytes, name, type)` if the shell defines it (I1-4: Filesystem write to the cache, then Share) and falls back to the blob download if it returns false; browsers never take the branch.
- Two web-only paths to replace on the device: `UI.download` (`23-ui-a.js:335`, 6 callers: save export `23-ui-a.js:355`, report
  `23-ui-f.js:752`, `23-ui-b.js:491`, chronicle `src/events/22-chronicle/chronicle.core.js:125`, picture
  `src/ui/9994-share-a-picture/share.core.js:229`, mod example `src/core/65-mods/mods.core.js:282`). There is no `window.open` or `target=_blank`.
  `navigator.share` with files (`share.core.js:243`) and the file picker for loading a save (`23-ui-a.js:361`) should work in
  WKWebView [U].

### 7.5 Rendering: HTML for panels, one canvas for maps with culling, redraw only on change
- **Good:** no idle animation loop (19 `requestAnimationFrame` uses, all for a running animation or one deferred draw); one
  redraw a press (`src/ui/999999-one-redraw`); map tiles cut at 256 px and kept (`inkmap.core.js:401-410`,
  `c-draw.core.js:33-45`), only the tiles in view drawn, labels culled to the view (`23-ui-c.js:1175`, `1196`).
- **Against "one canvas":** 9 canvases, each on its own screen: `#titlemap` (`23-ui-a.js:544`), `#worldmap` (`23-ui-a.js:1601`),
  `#gmap` (`23-ui-c.js:1049`), `#warmap` (`23-ui-d.js:2166`), `#battlecv` (`23-ui-b.js:992`), `#campmap` (`23-ui-b.js:1051`), `#bigmap`
  (`23-ui-b.js:1258`), `#jrmap` (`atlas.core.js:251`), `#helpgc` (`fold.core.js:125`). Only one is on screen at a time; each keeps
  its own view picture (`inkmap.core.js:429`). Read as "one canvas per map on screen, sharing one tile cache" (D-076).
- Maps are drawn at 1 canvas pixel per CSS pixel (no `devicePixelRatio`): soft on a 3x screen, light on memory. A choice to
  make with D9.

### 7.6 Animate only transform and opacity
**[I1-2 done: the bar `width` transition is gone (96-big-moments already tweens a bar with `transform`) and the steel glint's `left` sweep is a `translateX`. Left, with the reason: the colour, border and `box-shadow` fades on buttons and inputs (page.html, `look.b-base` 139 and 155, `scene.d-style` 86 and 91: paint-only, 100 to 150 ms, on a press, not a loop); `fold-flash` box-shadow (1.3 s, once, on a jump to a section); `lkPulse` filter (300 ms, once); `clip-path` reveals (`look.g-title`, `scene.d-style`, once); `stroke-dashoffset` (`n-motion`, SVG, once); `visibility` beside a transform (harmless). Converting those means an overlay pseudo-element on every control for no measured gain.]** 14 of 29 `transition` declarations animate something else: colours and borders on buttons (`look.b-base.core.js:139`, `155`;
`scene.d-style.core.js:86`, `91`; `page.html:23` twice), `box-shadow` (`page.html:23`), a bar's `width` (`page.html:23`), and
`visibility` beside a transform (`look.c-layout.core.js:47`, harmless). Keyframes on `left` (`src/ui/61-illuminated-chronicle/illumination.core.js:44`),
`box-shadow` (`src/ui/90-collapsible-sections/fold.core.js:468`), `filter` (`look.e-rows.core.js:441`), `clip-path`
(`look.g-title.core.js:149`, `scene.d-style.core.js:237`), `stroke-dashoffset` (`n-motion.core.js:201`). Short colour fades on a
press are cheap; the bar width and the `left` sweep should become `transform`.

### 7.7 Performance: no data that grows forever, no allocations per frame, Map by id
- **State growth** [R] (sample saves `tests/saves/press/`): the state is **1.78 MB at year 0 and 4.01 MB at year 50** (gzip 309 →
  840 KB): `people` 848 → 1,713 KB, `realms` 396 → 1,060 KB, `wrec` 1 → 135 KB, `log` 2 → 119 KB (capped at 600 entries,
  `src/core/release/core/03-engine-base.js:1055`), `aiLog` 0 → 88 KB. The journal (62 KB at year 50) grows with every choice
  by design (replay). The dead are kept. X5's work.
- **Per-draw allocations** in `UI.gmDraw` (`23-ui-c.js:1122-1250`): `P()` returns a new array for every province, capital and
  army drawn (`1156`, `1174`, `1195`, `1219`); a `groups` object and arrays each draw (`1214-1218`); font strings built per
  draw (`1171`, `1205`); `VM.fitGm` reads layout on every draw (`c-draw.core.js:209`).
- **A draw per pointer move:** the pan calls `UI.gmDraw()` inside `onpointermove` (`23-ui-c.js:1302`; the war map the same
  at `23-ui-d.js:1146`), not once a frame; a 120 Hz iPhone sends up to 120 moves a second.
- Lookups by id: `A.prov(id)`, `A.realm(id)` and `A.P(id)` are index or object lookups; not audited further here.

### 7.8 Saves: one module
- **Nearly there.** `SAVES` (`src/core/release/core/22-saves.js:7`) owns every save: IndexedDB `ardan`/`slots`, four slots
  (`cur`, `bak1-3`), localStorage fallback (`22-saves.js:167-187`), a legacy import (`377-393`), a Web Lock against two tabs.
  Its storage is four functions (`open`, `get`, `put`, `clear`): one switch underneath them is all a native backend needs.
- **[I1-2 done]** the profile tab's 4 direct `localStorage` calls go through `UI.store`. (`SAVES.backend` and the `UI.store` native switch stay for I1-4.)
- **Outside it:** settings and small keys go through `UI.store` (`23-ui-a.js:46-66`, localStorage: settings, mods, the hall,
  folds), which is fine as the second funnel; **4 direct `localStorage` calls bypass both** in the profile tab
  (`src/ui/999996-profile-tab/profile.b-view.core.js:29`, `30`, `284`, `331`). Player mods are stored whole in localStorage
  through `UI.store` (`mods.core.js:36`, `44`): on the device they belong in a file.

### 7.9 Audio: one AudioContext, unlocked on the first tap, paused in the background
- **[I1-2 done]** `src/ui/60-audio-context`: `UI.AUDIO` owns one context (`latencyHint: 'playback'`), used by the effects and the score; turning the music off no longer closes it and turning it on makes none; the first `pointerdown` makes and resumes it when sound or music is on; it is suspended 220 ms after the page is hidden and resumed when shown (`UI.AUDIO.suspend()/resume()` for Capacitor's pause and resume, I1-4); `navigator.audioSession.type = 'playback'` where it exists. Test `oneSharedContext`.
- **Two contexts:** sound effects (`illumination.core.js:148`, made on the first sound once sound is on) and the score
  (`src/ui/73-music-score/music.core.js:452`, a **new context each time music is turned on**, closed when turned off).
  Plus an `OfflineAudioContext` for tests (`music.core.js:497`, fine).
- Unlock: the score starts on the first `pointerdown`/`keydown` (`music.core.js:487-488`). Background: the score fades and
  suspends on `visibilitychange` (`music.core.js:489`); **the effects context never suspends**. No `navigator.audioSession`.

### 7.10 Source in `src/`, `data/`, `assets/`; no folder layout assumed
- **Good.** The build reads `src/`, `data/` and the release source and writes one file wherever `--out` says; the page
  assumes no folder (everything inline). Nothing to change for `www/`.

## 8. The fixes, in order (sized; S under a day, M one to three days, L a week or more)

| # | Fix | Size | Rule | Goes into |
| --- | --- | --- | --- | --- |
| 1 | **done (I1-2)** `viewport-fit=cover` on `page.html:6`; check every fixed bar, sheet and toast with real insets (Playwright cannot fake them: test in TestFlight) | S | layout | I1-2 |
| 2 | **done (I1-2)** One base rule: no selection (except inputs), no callout, no tap highlight, `overscroll-behavior:none` | S | layout, 4.2 | I1-2 |
| 3 | `pointercancel` (and `setPointerCapture`) on the four drags: **left for D9** (the map drags: `23-ui-c.js:1273`, `23-ui-d.js:1130`, `atlas.core.js:374`, `m-field.core.js:122`; I1-2 was told not to touch the maps) | S | input | D9 |
| 4 | `:hover` rules inside `@media (hover:hover)`; archive the dead `UI.tipsInit` of `23-ui-b.js:12-80` | S | input | Gaps |
| 5 | **done (I1-2) except the skills rows (S1b)** 44-pt hit areas for `.tt`, `.tt-n`, `.chip`, `.v2-row`, `.prow` and the path links; a test that holds the count at 0 (the probe made into a feature test) | M | input | Gaps (with the tablet's phone shell) |
| 6 | **done (I1-2)** `vh` → `dvh` with a `vh` fallback line, 50 places | S | layout | I1-2 |
| 7 | **done (I1-2)** One audio module: one AudioContext for score and effects, made on the first tap, suspended on hide and `pause`, `navigator.audioSession.type` set while sound or music is on | M | audio | I1-2 |
| 8 | **partly done (I1-2: the 4 profile-tab calls, `UI.download`'s hook; `SAVES.backend` and `UI.store`'s native switch left for I1-4)** `SAVES.backend` switch (idb, local, native); profile tab's 4 `localStorage` calls through `UI.store`; `UI.store` with a backend switch; `UI.download` with a native branch | M | saves | I1-2 (the native branches in I1-4) |
| 9 | Map pan: one draw a frame (rAF-coalesced) on `#gmap`, `#warmap`, the atlas; no arrays, objects or closures in the draw loops; layout read once a gesture | M | rendering, performance | X7 part 2 (with D12b-1, which redraws the war map anyway) |
| 10 | **done (I1-2)** The bar `width` and the `left` sweep as `transform` | S | rendering | Gaps |
| 11 | State diet: cap `aiLog` and `wrec`, compact the dead, bound `realms` histories; save size held by a test | L | performance | X5 |
| 12 | One tile cache for both map layers and one kept view per visible canvas, freed when the screen closes | M | rendering, memory | D9 |
| 13 | Load and Next month inside the iPhone budget (§4.1) | L | performance | X7 part 2, D12b-1 |

**Not fixes, kept as they are:** the war map's right-click (a tap does the same), the keyboard shortcuts (each has a button),
wheel zoom (buttons and pinch exist), the 1x map canvases (a D9 choice), the one-file page (D-075).

## 9. The build rules (owner order 62, copied faithfully)

- **Input:** mouse or tap only. Use Pointer Events (pointerdown/move/up/cancel), never mouse-only events. Nothing may depend
  on hover, right-click, double-click or the keyboard. Tap targets must be at least 44×44 points.
- **Layout:** must work from a small iPhone (about 375×667 points) up to a Pro Max. Keep room for `env(safe-area-inset-*)`
  padding. Use dvh units, not vh.
- **Assets:** relative paths only (./). No CDNs, no web fonts from the internet, no network calls. Everything must work offline.
- **Rendering:** HTML for menus and panels, updating only what changed. One canvas for the map and the war map, with culling,
  and only redrawing when something changes. Animate only transform and opacity.
- **Performance:** no data that grows forever, no new objects inside per-frame loops, look things up by id with a Map. Test
  with the CPU slowed 4–6× to act like a phone.
- **Saves:** go through one save module, so the storage underneath can be switched to Capacitor storage later without
  touching the game code.
- **Audio:** one AudioContext, unlocked on the first tap, and paused when the app goes to the background.
- Keep the source in `src/`, `data/` and `assets/`. Later a build script will output `www/` for Capacitor, so don't hard-code
  paths that assume a particular folder layout.
- When something you build would make the iPhone version harder, say so and suggest the version that keeps the route open.

## 10. Pitfalls, all stages

- **Stale docs:** Capacitor's iOS page still says `App.xcworkspace`; Codemagic's Capacitor guide still runs `pod install`.
  For SPM: `App.xcodeproj` and `build-ipa --project`.
- **Xcode moves every September:** pin `xcode:` in `codemagic.yaml`, move on purpose; Capacitor at least 8.5 for Xcode 27.
- **Capacitor 9** (release candidate now): needs Xcode 27 and iOS 16, moves the app to a SwiftUI `@main` App [V, docs/next].
  Take it only after it is stable and after `npx cap migrate`; record the step.
- **Eviction:** never trust IndexedDB or localStorage for saves on the device (fact 5); keep the four-slot rotation in files.
- **Backgrounding:** an async save started on `pause` may be cut off [U]; keep the save small and fast (X5 helps).
- **Memory:** a WebView over its limit is killed and reloads blank [U]: the tile caches and kept views are the big items.
- **Review:** a page loaded from a web server, a placeholder, a link to a web store, or a screen that says "browser" invites a
  4.2 or 2.1 rejection.
- **Bundle id and name** are hard to change after the first upload; the SKU never shows.
- **Secrets:** the `.p8` and certificates live only in Codemagic; never in the repo, the chat or a commit.

## 11. Sources (all read 2026-11-16)

- Capacitor: [Updating to 8.0](https://capacitorjs.com/docs/updating/8-0) · [Updating to 8.5](https://capacitorjs.com/docs/updating/8-5) ·
  [iOS](https://capacitorjs.com/docs/ios) · [Swift Package Manager](https://capacitorjs.com/docs/ios/spm) ·
  [Config](https://capacitorjs.com/docs/config) · [Storage guide](https://capacitorjs.com/docs/guides/storage) ·
  [Preferences](https://capacitorjs.com/docs/apis/preferences) · [Filesystem](https://capacitorjs.com/docs/apis/filesystem) ·
  [App](https://capacitorjs.com/docs/apis/app) · [Splash Screen](https://capacitorjs.com/docs/apis/splash-screen) ·
  [Status Bar](https://capacitorjs.com/docs/apis/status-bar) · [Haptics](https://capacitorjs.com/docs/apis/haptics) ·
  [Capacitor 9 (next)](https://capacitorjs.com/docs/next/updating/9-0)
- Ionic: [Announcing Capacitor 8 (2025-12-08)](https://ionic.io/blog/announcing-capacitor-8) ·
  [Capacitor 8.5 released (2026-07-31)](https://ionic.io/blog/capacitor-8-5-released) ·
  [The future of Ionic's commercial products (2025-02-11)](https://ionic.io/blog/important-announcement-the-future-of-ionics-commercial-products)
- Expo: [EAS Build introduction](https://docs.expo.dev/build/introduction/)
- Apple: [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) ·
  [Upcoming SDK minimum requirements (2026-02-03)](https://developer.apple.com/news/?id=ueeok6yw) ·
  [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) ·
  [TestFlight](https://developer.apple.com/testflight/) ·
  [App Store Connect API](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api) ·
  [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) ·
  [Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions) ·
  [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) ·
  [Export compliance overview](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance) ·
  [Enroll](https://developer.apple.com/programs/enroll/) ·
  pages that would not render here (marked U where used): [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files),
  [Complying with encryption export regulations](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations),
  [HIG: Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)
- Codemagic: [Ionic/Capacitor quick start](https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/) ·
  [Signing iOS apps](https://docs.codemagic.io/yaml-code-signing/signing-ios/) ·
  [Publishing to App Store Connect](https://docs.codemagic.io/yaml-publishing/app-store-connect/) ·
  [Xcode 26.6 machine](https://docs.codemagic.io/specs-macos/xcode-26-6/) ·
  [Xcode update policy](https://docs.codemagic.io/specs/xcode-update-policy/) ·
  [Pricing](https://docs.codemagic.io/billing/pricing/) ·
  [codemagic.yaml basics](https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/) ·
  [CLI build-ipa](https://github.com/codemagic-ci-cd/cli-tools/blob/master/docs/xcode-project/build-ipa.md) ·
  [CLI get-latest-testflight-build-number](https://github.com/codemagic-ci-cd/cli-tools/blob/master/docs/app-store-connect/get-latest-testflight-build-number.md)
- WebKit and MDN: [WebKit bug 237322, Web Audio and the ringer switch](https://bugs.webkit.org/show_bug.cgi?id=237322) ·
  [MDN AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type) ·
  [WebKit, Updates to storage policy (2023-08-10)](https://webkit.org/blog/14403/updates-to-storage-policy/) ·
  [Capacitor issue 5478, blob URL downloads on iOS 15+](https://github.com/ionic-team/capacitor/issues/5478)
- Run here: npm registry (`npm view @capacitor/* version`), `npx cap add ios` with `@capacitor/cli` 8.6.2,
  `docs/research/ios/tap-probe.mjs` and `webkit-boot.mjs` (Playwright 1.63, Chromium and WebKit 2359).
