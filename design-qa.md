# Homepage services, Studio disclosure and content flow QA

## Accepted design sources

- Approved hero system: `homepage-profile-light-desktop.png` at 1432 × 895.
- Approved research-card system: `homepage-research-dark-final.png` at 1586 × 992.
- Hero comparison: `homepage-hero-copy-comparison.png`.
- Card-system comparison: `homepage-services-research-style-comparison.png`.

## Latest implementation evidence

- Hero desktop: `homepage-adjusted-hero-desktop.png`.
- Hero mobile: `homepage-adjusted-hero-mobile.png`.
- Services light desktop: `homepage-services-desktop.png`.
- Services dark desktop: `homepage-services-dark-desktop.png`.
- Services mobile: `homepage-services-mobile.png`.
- Studio disclosure: `homepage-studio-disclosure-desktop.png` and `homepage-studio-disclosure-mobile.png`.
- Combined teaching/talks/about section: `homepage-more-desktop.png`.

## Fidelity ledger

- Hero layout, portrait treatment, typography and white/black palette remain unchanged; only the user-requested intro and CTA labels changed.
- The primary CTA is now `Explore My Services`; the secondary CTA is `My Research`, with both scrolling to the correct section.
- The services cards reuse the approved research-card radius, border, shadow, monochrome palette and subtle tilt motion while remaining simpler and text-led.
- The section order is now hero, services, research, then one compact teaching/talks/about section.
- The final section deliberately changes from cards to three editorial rows, preventing a repetitive card grid and shortening the page.
- The Studio disclosure uses the same typography, pill-button and border system; it clearly separates commercial creative work from the primary researcher and lecturer identity.
- Light and dark states retain exact white and black backgrounds with no new accent palette.

## Browser verification

- Flow: homepage loads -> `Explore My Services` scrolls to services -> `My Research` scrolls to research -> Studio navigation opens disclosure -> visitor can stay or continue externally.
- Desktop checked at 1440 × 900; mobile checked at 390 × 844.
- Mobile services use a horizontal snap rail with zero page-level horizontal overflow.
- Studio disclosure is centered at 610 × 451 on desktop and fits at 359 × 450 on mobile; opening it closes the mobile menu.
- Studio disclosure receives focus on open, traps keyboard focus, closes with Escape and restores focus to the Studio link.
- Conference filter still reports three visible publications and updates the active state.
- Page identity, meaningful DOM content and section links passed.
- Browser console returned no warnings or errors.
- JavaScript syntax checks and `git diff --check` pass.

## Above-the-fold copy diff

- Intentional, requested changes only: the supporting line now merges the human-centered AI and healthcare focus; CTAs changed from research/about to services/research.
- No additional hero labels, badges, decorative graphics or competing actions were added.

final result: passed
