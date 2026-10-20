# Components

Shared UI building blocks (atoms, molecules, organisms). Accessibility is enforced in two layers
(ADR-004).

## Automated: lint (CI)

`eslint-plugin-react-native-a11y` runs on `src/components/**` and `src/screens/**`. Every interactive
element needs an `accessibilityRole` (or `role`), and icon-only controls and text inputs need an
`accessibilityLabel`. `npm run lint` fails the PR otherwise. `has-accessibility-hint` is off: hints are
optional and would flag every labelled control.

## Manual: checked in design and code review

These cannot be linted, so reviewers check them against this list:

- **Touch targets:** at least **44 × 44 pt**. If the visible control is smaller (an icon button, a
  chip), grow the hit area with `hitSlop` or padding rather than the artwork.
- **Contrast:** body text at least **4.5 : 1** against its background, large text (18pt, or 14pt bold)
  and icons that carry meaning at least **3 : 1**. Use the semantic tokens in
  `design-system/tokens.ts`; do not pair `fgTertiary` or `fgDisabled` with essential copy.
- **Not color alone:** state (selected, error, saved) must also change an icon, a label or a shape.
- **Screen reader pass:** open the changed screen with VoiceOver or TalkBack once and confirm focus
  order and spoken labels read naturally.
