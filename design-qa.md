# Homepage redesign QA

## Source comparison

- Hero reference: `exec-7fc29fd3-1f8d-406a-a54b-ee2de738b891.png`
- Hero implementation: `homepage-dark-desktop.png` at 1586 × 992
- Research reference: `exec-baa9e305-0658-4110-9e93-a4f4802167d7.png`
- Research implementation: `homepage-research-dark-final.png` at 1586 × 992
- Compared each source and implementation side by side at the same viewport.

## Verification

- Desktop hero fills the viewport with no horizontal overflow.
- Mobile hero, navigation menu and horizontal publication rail fit at 390 × 844.
- Dark and light themes render correctly and the user preference is persisted.
- Publication filter reports three visible conference papers and updates `aria-pressed`.
- All four publication images and the portrait load at their natural dimensions.
- Primary navigation, hero CTAs, Studio link and publication links have real destinations.
- Console and page-error capture returned no errors.
- JavaScript syntax checks and `git diff --check` pass.
- Blocking global loader is disabled on the homepage so content is immediately visible.
- Motion is disabled under `prefers-reduced-motion`.

final result: passed
