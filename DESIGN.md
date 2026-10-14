# Aliko Diamond Key interface system

## Purpose

Support property discovery and clear, accountable administration. Public pages retain the gold/emerald Aliko identity and brand logo. Authenticated workspaces prioritise readable data, actionable queues, current-page orientation and predictable navigation.

## Navigation

The brand is on the left of the header. Only the theme toggle and a hamburger button are on the right. Language, account actions, logout and role-specific destinations live inside one right-aligned, solid, vertically scrollable menu. Escape closes it and returns focus. Clicking outside or navigating closes it. No back/forward controls or competing avatar dropdown remain.

Desktop sidebars provide shortcuts to the same destinations. Admin navigation is declared once in src/lib/navigation/workspace.ts and reused in the sidebar and hamburger menu. Professional dashboard hashes retain the existing tab behaviour. Mobile uses the shared header menu rather than additional overlapping drawers.

## Hierarchy and layout

Private workspaces use a restrained dark navy or light neutral canvas, solid panels, an emerald accent and sans-serif headings. Section labels, main headings, descriptions, data and actions have distinct sizes and spacing. Standard actions have at least a 44px target; forms have visible labels and focus states. Tables have comfortable row padding and contained horizontal scrolling on small screens.

## Icons and movement

Emoji identify navigation categories and support states; they are decorative with accessible text labels beside them. SVG icons remain on functional actions. The overview diamond/key illustration draws once on entry and respects prefers-reduced-motion. The favicon uses a high-contrast diamond/key mark; the company header logo is unchanged.

## Theme contract

Workspace colour tokens live in src/lib/styles/workspace.css. Field, NIN, consent and password tokens remain in src/app.css. Light mode uses dark text on white fields; dark mode uses light text on dark fields. Landing search retains its explicit dark-panel exception. New styling must not replace authoritative data with demonstration records or remove role/subscription checks.

## Verification

Use public regression tests and authenticated, read-only browser checks. Confirm both themes, mobile/desktop layout, Arabic RTL, navigation uniqueness, keyboard interaction, loading/empty/error states and browser errors. Do not approve/reject customer records or perform payments for visual testing.
