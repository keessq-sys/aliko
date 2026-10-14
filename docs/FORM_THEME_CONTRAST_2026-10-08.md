# Shared form contrast — 8 October 2026

The application uses shared field tokens for backgrounds, entered text, placeholder/helper text, borders, focus indicators and status colours in light and dark themes. Ordinary text inputs, password/NIN fields, textareas and selectors use this baseline across public forms and workspaces. Range, file, colour and button controls retain their specialised behaviour. Landing search keeps its scoped dark-panel colours in both themes.

Shared password components use the helper-text colour for the visibility button and instructions, with explicit password-meter track and status colours. The NIN component uses theme-specific format-confirmation, error and progress colours. Consent wording uses the shared text colour, with theme-specific checkbox/radio accents and visible focus outlines. Disabled selectors retain readable text.

Six filled-form browser scenarios cover buyer, manager and agent signup in both themes. They check entered-text contrast of at least 4.5:1, field-border/focus contrast of at least 3:1, consistent field backgrounds, NIN format confirmation, consent accessibility and mobile overflow. They never submit accounts or NIN records to production.

## Verification

- Cloudflare production build completed successfully.
- Six filled-form contrast tests passed for buyer, manager and agent signup in both themes.
- Cloudflare Pages deployment succeeded: https://1f1559dd.aliko-3f9.pages.dev.
- Live filled-manager-form accessibility and dark hero search checks passed in light and dark themes with no browser exceptions and no form submissions.
- Final npm test passed: zero Svelte errors/warnings, 83 backend tests and 128 Chromium tests passed; 7 browser tests skipped.
