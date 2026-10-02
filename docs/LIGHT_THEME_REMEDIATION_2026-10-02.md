# Featured photographs and light-theme remediation — 2 October 2026

The featured-property preview now renders the existing local gallery photographs independently of the live query's loading state when the isolated demo catalogue is enabled. Production continues to use approved live records. Live inspection found that Cloudflare production was missing `PUBLIC_CONVEX_URL`, leaving the browser's realtime client disabled and the featured grid loading indefinitely. The production URL is now explicitly declared in the deployment configuration; preview remains isolated behind its placeholder URL. An empty live featured collection now explains that approved listings are being prepared instead of leaving a blank grid.

Image recovery checks failures that happen before hydration and tries the next photograph from the same property's gallery. Each image has a stable identity so a delayed error cannot reject a different, working photograph. Exhausted galleries display an explicit photograph-unavailable placeholder. Broken thumbnails are hidden, and thumbnails appear above the image gradient.

Scroll-reveal thresholds are capped for tall sections, allowing the featured grid to become visible on short mobile screens with animations enabled.

Light-only contrast rules cover property prices, shared primary/secondary/danger buttons, tabs, sidebars, role badges, wizard steps, notification surfaces, dashboard panels and statistics, form placeholders and keyboard focus. Dark photo banners, city/development captions and full-screen image viewers retain light foregrounds on their dark backgrounds. Existing dark-theme colour rules are unchanged.

The expanded accessibility inspection also fixed the property-enquiry textarea's accessible name and the service-request page title.

## Verification

- Production build completed successfully.
- Local visual inspection: all six featured cover photographs loaded in both themes; photo captions remained white in both themes.
- Browser regression coverage includes photo loading, same-gallery recovery, exhausted galleries, shared control contrast and animated reveal on a 390 × 568 screen.
- Accessibility coverage expanded to 11 routes in both themes at 390px and 1280px, including property detail, the interior-design request form, and agent/manager registration.
- `npm test` passed: Svelte reported 0 errors and 0 warnings; all 34 backend tests passed; 84 Chromium browser tests passed with 7 existing provider/authenticated-administrator tests skipped because their required staging configuration is unavailable.
- All 44 route/theme/viewport accessibility checks passed. Image loading, fallback recovery, exhausted galleries, shared controls and short-screen animation regression tests passed.
- `git diff --check` passed.
- Published to Cloudflare Pages at `https://941fa4e1.aliko-3f9.pages.dev`; the custom domain `https://alikodiamondkey.com` was checked after release.
- Production home, catalogue and interior-design request pages returned HTTP 200 and had no serious or critical WCAG violations in either theme once their styles loaded.
- The production browser opened its realtime connection to `gallant-husky-352.eu-west-1.convex.cloud` without query errors; the empty approved featured collection displayed its explanatory status.
- GitHub checks passed for the UI commit `9a467be` and deployment-configuration commit `881c26f`.

## Limits

The local preview uses opt-in demonstration records. Publishing genuine approved featured listings and their own photographs remains an inventory administration task. These changes do not insert demonstration inventory into production. Shared authenticated-workspace styles are corrected in source and covered by control-level checks; no authenticated administrator account was used for a manual workspace review.
