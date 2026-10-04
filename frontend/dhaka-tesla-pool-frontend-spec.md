# Dhaka Tesla Pool — Exact Frontend Reconstruction Specification

**Purpose:** Give this file to OpenCode as the implementation brief for recreating the current passenger dashboard exactly.

## 1. Product scope and implementation constraints

Build a polished, frontend-only passenger dashboard for a pooled electric auto service in Dhaka.

- This is the actual application screen, not a marketing landing page.
- Keep all data and ride behavior simulated in React state.
- Do not connect a real map, payment provider, database, or backend yet.
- Do not add authentication, extra pages, modals, or unrequested features.
- The experience must be smooth, fresh, highly animated, accessible, and responsive.
- Use React 19 + TypeScript.
- Use Lucide React for icons.
- Use CSS custom properties and normal CSS for the exact visual treatment.
- Use semantic HTML: `aside`, `nav`, `main`, `header`, `section`, `article`, `label`, and `button`.

## 2. Visual direction

The style is **Kinetic Glass Rails**: a bright transit command dashboard with a warm-white canvas, floating white surfaces, deep green information hierarchy, and vivid mint activity signals.

Visual principles:

1. Airy, calm background with restrained mint glow in the upper-left corner.
2. Compact vertical navigation rail floating at the left.
3. White panels with thin low-contrast borders and very soft shadows.
4. Deep forest green for primary text and the simulated map.
5. Mint green for live states, active route information, and the primary action.
6. Rounded geometry, but not cartoonishly pill-shaped; only small status badges are pills.
7. Motion communicates live transport activity: moving vehicle, moving route dashes, radar sweep, live pings, staged page entrance.

## 3. Exact design tokens

Declare these values globally. The OKLCH values are the source of truth; do not replace them with arbitrary approximations.

```css
:root {
  --radius: 0.5rem;
  --background: oklch(0.982 0.004 160);
  --foreground: oklch(0.218 0.035 165);
  --ink: oklch(0.218 0.035 165);
  --forest: oklch(0.341 0.071 157);
  --mint: oklch(0.775 0.155 167);
  --paper: oklch(0.982 0.004 160);
  --card: oklch(1 0 0);
  --destructive: oklch(0.577 0.245 27.325);
}
```

Color roles:

- `--paper`: the page canvas and pale controls.
- `--ink`: deepest text and the icon color on mint surfaces.
- `--forest`: headings, active navigation, map background, and strong labels.
- `--mint`: live indicator, active route, moving Tesla, and primary CTA.
- `white`: panel and compact card surfaces.
- `--destructive`: cancel-trip text/icon only.

Use `color-mix(in oklab, …)` exactly where specified below to maintain the intended translucent hierarchy. Do not flatten these mixes into unrelated gray or green values.

## 4. Typography

Load fonts in the document head:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap">
```

Font assignments:

- Body/interface: `Figtree, sans-serif`.
- Headings, large figures, driver initials: `Outfit, sans-serif`.
- All heading letter spacing: `0`.
- Do not use Inter or Poppins.

Exact type scale:

- Brand eyebrow: 10px, weight 700, uppercase, `letter-spacing: .18em`.
- Main greeting: 32px desktop / 26px mobile, line-height 1.1, weight 650.
- Greeting support copy: 14px.
- Main panel titles: 21px, weight 650.
- Map route title: 24px, weight 650.
- Compact ride-status title: 17px.
- Wallet amount: 19px, Outfit.
- Fare: 34px, line-height 1, Outfit; decimal `.00` is 17px at 35% opacity.
- Driver name: 14px.
- Driver metadata: 11px.
- Map support copy: 12px.
- Eyebrows/field labels/utility labels: 8–10px as detailed below.

## 5. Overall page geometry

### Desktop shell

```css
.app-shell {
  min-height: 100vh;
  display: flex;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 4% 0%, color-mix(in oklab, var(--mint) 9%, transparent), transparent 26%),
    var(--paper);
  color: var(--ink);
}
```

The shell has two children:

1. Fixed-width left sidebar: exactly 88px.
2. Flexible dashboard content: maximum 1320px, centered in remaining width.

### Main dashboard container

```css
.dashboard {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  min-width: 0;
  padding: 12px 8px 24px;
}
```

### Desktop content grid

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(340px, .78fr) minmax(540px, 1.22fr);
  gap: 26px;
}
.control-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
```

The left column contains, in order: booking panel, ride-status panel, last-ride strip. The right column contains one map panel filling the available height.

## 6. Left navigation rail — exact dimensions and behavior

The navigation is a floating vertical rail, not a full-height rectangular navbar.

```css
.sidebar {
  width: 88px;
  flex: 0 0 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 0;
  border: 1px solid color-mix(in oklab, var(--ink) 7%, transparent);
  border-radius: 28px;
  background: color-mix(in oklab, white 92%, transparent);
  box-shadow: 0 18px 50px color-mix(in oklab, var(--ink) 6%, transparent);
}
```

Because the outer shell has 24px padding, the rail starts 24px from the left and top edges. Its usable height is viewport height minus 48px.

### Brand mark

- Size: 44 × 44px.
- Icon: Lucide `Zap`, 19px, stroke width 2.5.
- Center icon with grid placement.
- Radius: 15px.
- Text/icon color: `var(--forest)`.
- Background: mint mixed at 13% with transparency.
- Border: 1px mint mixed at 25%.

### Navigation list

- Starts 40px below the brand mark.
- Vertical stack with 12px gap.
- Items in order: Home, My rides, Wallet, Profile.
- Icons: `Home`, `Route`, `WalletCards`, `UserRound`, each 19px.
- Every icon button must have `aria-label` and `title`.

Each nav button:

```css
width: 46px;
height: 46px;
display: grid;
place-items: center;
border: 0;
border-radius: 15px;
color: color-mix(in oklab, var(--forest) 42%, transparent);
background: transparent;
transition: .25s ease;
```

Hover state:

- Color becomes `var(--forest)`.
- Background becomes ink at 5%.
- Translate upward 2px.

Active Home state:

- Foreground: `var(--paper)`.
- Background: `var(--forest)`.
- Shadow: `0 8px 20px color-mix(in oklab, var(--forest) 22%, transparent)`.
- Hover must retain the active colors.

### Bottom avatar

- Content: `RA`.
- Anchored to rail bottom with `margin-top: auto`.
- Size: 42 × 42px.
- Circular.
- Border: 1px forest at 12%.
- Background: forest at 6%.
- Text: forest, 11px, weight 700.
- `aria-label="Open profile"`.

## 7. Header/top bar

The top bar is a horizontal flex row with content separated to opposite ends.

```css
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 0 8px;
  margin-bottom: 28px;
}
```

Left content, exact copy:

- Eyebrow: `DHAKA TESLA POOL`.
- H1: `Good evening, Rafi`.
- Supporting line: `Where are you headed today?`.

Eyebrow styling:

```css
margin: 0 0 5px;
color: color-mix(in oklab, var(--forest) 55%, transparent);
font-size: 10px;
font-weight: 700;
letter-spacing: .18em;
text-transform: uppercase;
```

### TeslaPay card

Content:

- `WalletCards` icon, 18px.
- Label: `TeslaPay balance`.
- Amount: `৳ 1,240`.
- `ChevronDown`, 16px.

Container:

```css
display: flex;
align-items: center;
gap: 12px;
min-width: 205px;
padding: 12px 15px;
border: 1px solid color-mix(in oklab, var(--ink) 6%, transparent);
border-radius: 18px;
background: white;
box-shadow: 0 12px 30px color-mix(in oklab, var(--ink) 5%, transparent);
```

Wallet icon tile:

- 37 × 37px, radius 12px.
- Forest icon on mint-at-15% background.

Label:

- 10px, weight 700, uppercase, `letter-spacing: .08em`.
- Forest at 52%.

Amount:

- Top margin 2px.
- 19px Outfit, forest.

## 8. Shared panel styling

All major panels use:

```css
.panel {
  border: 1px solid color-mix(in oklab, var(--ink) 6%, transparent);
  border-radius: 26px;
  background: white;
  box-shadow: 0 20px 48px color-mix(in oklab, var(--ink) 5%, transparent);
}
```

Do not nest a decorative card inside another card. Internal areas are unframed rows, controls, and dividers.

## 9. Booking panel

Panel padding: exactly 27px.

### Heading row

- Flex row; top aligned; space-between; 16px gap.
- Bottom margin: 24px.
- Eyebrow: `PLAN YOUR ROUTE`.
- H2: `Request a pooled ride`.
- Right badge: `Live`.

Live badge:

```css
display: inline-flex;
align-items: center;
gap: 7px;
padding: 6px 10px;
border: 1px solid color-mix(in oklab, var(--mint) 24%, transparent);
border-radius: 999px;
background: color-mix(in oklab, var(--mint) 10%, transparent);
color: var(--forest);
font-size: 10px;
font-weight: 700;
text-transform: uppercase;
```

Its live dot is 6 × 6px, circular, mint, with the `ping-soft` animation.

### Route selectors

Use two stacked labels with a 10px vertical gap. Each selector row:

```css
min-height: 60px;
display: flex;
align-items: center;
gap: 13px;
padding: 9px 14px;
border: 1px solid color-mix(in oklab, var(--ink) 7%, transparent);
border-radius: 17px;
background: color-mix(in oklab, var(--paper) 75%, white);
transition: .25s ease;
```

Hover/focus-within:

- Border becomes mint at 45%.
- Background becomes `var(--paper)`.
- Translate right by 2px.

Pickup row:

- 9 × 9px solid mint dot.
- Glow: `0 0 12px` mint at 70%.
- Small field label: `PICKUP`.
- Default selected location: `Banani`.
- Right icon: `LocateFixed`, 17px.

Drop-off row:

- 9 × 9px circular marker with 2px forest-at-38% border.
- Small field label: `DROP-OFF`.
- Default selected location: `Gulshan`.
- Right icon: `MapPin`, 17px.

Available locations, in this exact order:

1. Banani
2. Gulshan
3. Mohakhali
4. Dhanmondi
5. Mirpur
6. Uttara
7. Farmgate
8. Bashundhara

The currently selected location in the opposite selector must be disabled to prevent identical pickup and drop-off.

Select styling:

- Width 100%.
- Native arrow hidden with `appearance: none`.
- No border, outline, or background.
- Forest text, 14px, weight 650.

Small field label:

- Forest at 47%.
- 9px, weight 700, uppercase, `letter-spacing: .1em`.

### Route swap button

Place absolutely between the two fields:

```css
right: 46px;
top: 53px;
z-index: 2;
width: 28px;
height: 28px;
border: 3px solid white;
border-radius: 9px;
background: var(--forest);
color: var(--paper);
```

- Icon: `ArrowDownUp`, 16px.
- On hover, rotate 180 degrees over `.3s ease`.
- Clicking swaps pickup and drop-off values.
- Label/title: `Swap pickup and destination` / `Swap route`.

### Ride options row

```css
display: flex;
justify-content: space-between;
align-items: flex-end;
gap: 20px;
margin-top: 25px;
padding-top: 20px;
border-top: 1px solid color-mix(in oklab, var(--ink) 7%, transparent);
```

#### Seat stepper

- Label: `SEATS NEEDED`.
- Default: 1.
- Minimum: 1.
- Maximum: 3.
- Stepper starts 7px below label.
- Horizontal gap: 13px.
- Minus and plus controls: 27 × 27px, 1px ink-at-9% border, 9px radius, paper background, forest text, weight 700.
- Count uses a fixed 12px width and centered text.
- Accessible labels: `Remove seat`, `Add seat`.

#### Fare block

- Right aligned vertical stack.
- Label: `YOUR POOLED FARE`.
- Initial fare: `৳ 61.00` for Banani → Gulshan with one seat.
- Payment copy: `Cash or TeslaPay`.
- Payment copy: top margin 4px, forest at 45%, 10px, normal style.

Exact simulated fare formula:

```ts
const distances = {
  Banani: 2,
  Gulshan: 3,
  Mohakhali: 4,
  Dhanmondi: 7,
  Mirpur: 10,
  Uttara: 13,
  Farmgate: 6,
  Bashundhara: 8,
};

fare = 40 + Math.abs(distances[pickup] - distances[dropoff]) * 14 + seats * 7;
```

Recalculate immediately whenever pickup, drop-off, or seats changes.

### Primary action

```css
width: 100%;
min-height: 50px;
margin-top: 23px;
display: flex;
align-items: center;
justify-content: center;
gap: 9px;
border: 0;
border-radius: 16px;
background: var(--mint);
color: var(--ink);
font-size: 14px;
font-weight: 750;
box-shadow: 0 12px 25px color-mix(in oklab, var(--mint) 30%, transparent);
transition: .22s ease;
```

States:

1. Idle: `CarFront` 19px + `Request pooled ride`.
2. Searching: 16px spinner + `Matching nearby Teslas`; button disabled.
3. Matched: `Navigation` 18px + `View arriving Tesla`.

Hover: translate up 2px and increase shadow to `0 16px 28px` mint at 38%. Active: scale to `.98`.

Spinner:

- 16 × 16px.
- 2px forest-at-22% circular border.
- Top border forest.
- Rotate continuously in `.8s linear`.

Clicking while idle or matched sets state to `searching`; after 1500ms set it to `matched`.

## 10. Ride-status panel

Panel padding: `23px 27px`.

Heading row:

- Center aligned.
- Bottom margin: 17px.
- Eyebrow: `RIDE STATUS`.
- Dynamic title:
  - Idle: `Ready to request`.
  - Searching: `Finding your pool`.
  - Matched: `Driver arriving`.
- Availability label:
  - Idle/searching: `3 seats open`.
  - Matched: `1 seat open`.
- Availability uses mint text, transparent border/background, 10px bold uppercase.

Driver row:

- Flex, center aligned, 13px gap.
- Avatar: 46 × 46px circle; initials `JU`; forest-at-7% background; forest Outfit bold text.
- Online dot: absolute at bottom-right 1px; 10 × 10px; 3px white border; mint fill.
- Driver: `Jashim Uddin`.
- Vehicle/rating: `Tesla DHA-14 · 4.9 ★`; star mint.
- ETA block pushes right with `margin-left: auto`, right aligned.
- ETA label: 9px, weight 700, forest at 45%.
- ETA value: `—` until matched; `4 min` when matched; 16px Outfit.

Progress track:

- Four equal columns, top margin 21px.
- Labels: `Requested`, `Matched`, `Arrived`, `Started`.
- Each dot: 10 × 10px; 2px white border; forest-at-18% fill; 1px outer forest-at-10% shadow.
- Connecting line: 2px high, starts at left 7px/top 4px, width `calc(100% - 5px)`, forest at 9%.
- Last step has no outgoing connector.
- Searching marks only `Requested` complete.
- Matched marks `Requested` and `Matched` complete.
- Complete text becomes forest + weight 700; completed dots and outgoing lines become mint.

## 11. Last-ride strip

This is a compact row below ride status, not a large panel.

```css
display: flex;
align-items: center;
gap: 13px;
padding: 16px 20px;
border: 1px solid color-mix(in oklab, var(--ink) 6%, transparent);
border-radius: 18px;
background: white;
color: color-mix(in oklab, var(--forest) 50%, transparent);
```

Content:

- `History` icon, 17px.
- Small label: `LAST RIDE`, 9px bold uppercase.
- Route: `Farmgate → Dhanmondi`, 12px forest.
- Fare at right: `৳ 54`, 12px forest.
- `ChevronDown`, 15px.

## 12. Map panel

Panel:

```css
min-width: 0;
padding: 28px;
display: flex;
flex-direction: column;
gap: 21px;
```

### Map heading

- Horizontal flex; top aligned; space-between; 20px gap.
- Eyebrow: `ROUTE INTELLIGENCE`.
- Dynamic heading: `{pickup} → {dropoff}`; arrow is mint.
- Support copy: `Simulated live fleet activity across Dhaka`.
- Support copy: margin top 4px, forest at 48%, 12px.

Legend:

- Horizontal flex, 15px gap, top padding 6px.
- Entries: `Your Tesla`, `Nearby`.
- Each entry: 9px, weight 700, uppercase, forest at 47%, no wrapping.
- Dots: 8 × 8px circles.
- Your Tesla: mint dot with `0 0 9px var(--mint)` glow.
- Nearby: forest at 25%.

### Map canvas

This is a designed simulation, not a real geographic map.

```css
position: relative;
flex: 1;
min-height: 480px;
overflow: hidden;
border-radius: 21px;
background: var(--forest);
box-shadow: inset 0 0 80px color-mix(in oklab, var(--ink) 45%, transparent);
```

#### Grid texture

- Absolute fill.
- Opacity `.12`.
- Two perpendicular 1px linear gradients, mint at 30%.
- Grid cell size: 55 × 55px.

#### Radar sweep

- Absolute full height.
- Starts with left `-50%`.
- Width `45%`.
- Horizontal gradient: transparent → mint at 12% → transparent.
- Animates continuously across the map in 5 seconds, ease-in-out.

#### SVG roads and route

Use an absolutely positioned SVG with `viewBox="0 0 800 500"`, `preserveAspectRatio="none"`, width/height 100%.

Road paths:

```svg
<path d="M-20 410 C130 385 145 245 290 255 S480 370 830 65" />
<path d="M85 -20 C115 105 230 112 255 235 S180 420 300 530" />
<path d="M480 -20 C425 120 515 190 650 205 S760 320 830 350" />
```

Road style:

- No fill.
- Paper at 9% stroke.
- 4px non-scaling stroke.
- First road is 9px wide and opacity `.6`.

Active route path:

```svg
<path d="M92 390 C185 360 195 278 295 260 S520 310 690 105" />
```

Route style:

- No fill.
- Mint stroke, 2.5px.
- Rounded caps.
- Dash pattern `9 10`.
- Non-scaling stroke.
- Drop shadow: 5px mint at 65%.
- Animate dash offset continuously over 1.3 seconds.

#### Pickup/drop-off labels

Pickup label: `left: 8%; top: 70%`.
Drop-off label: `right: 8%; top: 12%`.

Each label stack:

- Centered vertical flex, 7px gap.
- Text badge: 5px 8px padding, 1px paper-at-12% border, 6px radius, ink-at-65% background, mint text, 8px weight 800 uppercase, `.1em` tracking, 7px backdrop blur.
- Marker dot: 9 × 9px, 2px paper border, circular, 12px paper glow.
- Badge text updates with current pickup/drop-off.

#### Moving Tesla

```css
width: 31px;
height: 31px;
position: absolute;
z-index: 3;
display: grid;
place-items: center;
border: 1px solid color-mix(in oklab, var(--paper) 55%, transparent);
border-radius: 50%;
background: var(--mint);
color: var(--ink);
box-shadow:
  0 0 0 8px color-mix(in oklab, var(--mint) 13%, transparent),
  0 0 28px color-mix(in oklab, var(--mint) 60%, transparent);
```

- Icon: `CarFront`, 15px.
- Animate over 9 seconds, ease-in-out, infinite alternate:
  - 0%: left 12%, top 76%.
  - 52%: left 40%, top 48%.
  - 100%: left 83%, top 17%.

#### Nearby vehicles

Three 25 × 25px circular markers:

- 1px paper-at-12% border.
- Ink-at-45% background.
- Paper-at-65% icon color.
- `CarFront` icon: 13px.
- Hover: scale 1.2 and turn mint over `.25s ease`.

Positions:

- Vehicle A: left 34%, top 30%; show `3 min` 29px below marker in 8px paper text.
- Vehicle B: left 60%, top 60%.
- Vehicle C: left 20%, top 47%.

#### Live map status card

Position: left 20px, bottom 20px.

```css
display: flex;
align-items: center;
gap: 11px;
padding: 10px 13px;
border: 1px solid color-mix(in oklab, var(--paper) 12%, transparent);
border-radius: 12px;
background: color-mix(in oklab, var(--ink) 66%, transparent);
backdrop-filter: blur(10px);
```

- Mint live dot: 8 × 8px with soft ping animation.
- Label: `LIVE STATUS`, 8px weight 700, `.1em` tracking, paper at 42%.
- Status:
  - Idle/searching: `4 Teslas nearby`.
  - Matched: `Jashim is on the way`.
- Status text: 11px, paper.

### Map statistics footer

Horizontal flex, center aligned, 28px gap.

Stat 1:

- `CarFront`, 17px.
- Value: `04`.
- Label: `Fleet nearby`.
- Icon tile uses forest icon on mint-at-13% background.

Stat 2:

- `Clock3`, 17px.
- Value: `03 min`.
- Label: `Average wait`.

Stat 3:

- `Zap`, 17px.
- Value: `92%`.
- Label: `Vehicle charge`.

Each icon tile:

- 37 × 37px, radius 12px.
- Normal state: forest-at-50% icon, forest-at-6% background.

Values: 14px Outfit, forest. Labels: 9px, forest at 48%.

When ride state is searching or matched, show a right-aligned transparent `Cancel trip` button with `X` 15px, 5px gap, 11px bold destructive text. Clicking it returns state to idle. Do not show this button in idle state.

## 13. Exact animation definitions

```css
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes drive {
  0% { left: 12%; top: 76%; }
  52% { left: 40%; top: 48%; }
  100% { left: 83%; top: 17%; }
}
@keyframes route-dash {
  to { stroke-dashoffset: -40; }
}
@keyframes radar {
  from { transform: translateX(-140%); }
  to { transform: translateX(380%); }
}
@keyframes ping-soft {
  0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--mint) 60%, transparent); }
  75%, 100% { box-shadow: 0 0 0 14px transparent; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

Page entrance animation:

```css
.animate-rise {
  animation: rise .65s cubic-bezier(.22, .8, .25, 1) both;
}
.delay-1 { animation-delay: .08s; }
.delay-2 { animation-delay: .16s; }
.delay-3 { animation-delay: .24s; }
```

Apply entrance timing as follows:

- Top bar: no delay.
- Booking panel: `.08s` delay.
- Ride-status panel: `.16s` delay.
- Map panel: `.16s` delay.
- Last-ride strip: `.24s` delay.

Motion-accessibility requirement:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

## 14. Responsive behavior

### Tablet/narrow desktop — 1050px and below

```css
.dashboard-grid { grid-template-columns: 1fr; }
.map-panel { min-height: 670px; }
.map-canvas { min-height: 480px; }
```

- Keep the 88px left rail visible until the 700px breakpoint.
- Stack booking/status/history above the map.

### Mobile — 700px and below

```css
.app-shell { padding: 12px; }
.sidebar { display: none; }
.dashboard { padding: 8px 0 88px; }
.topbar { align-items: flex-start; margin-bottom: 20px; }
.topbar h1 { font-size: 26px; }
.subheading { display: none; }
.wallet-card { min-width: 0; padding: 10px; }
.wallet-card .wallet-icon,
.wallet-card svg:last-child,
.wallet-card span { display: none; }
.wallet-card strong { font-size: 16px; }
.dashboard-grid { gap: 16px; }
.booking-panel,
.active-panel,
.map-panel { padding: 20px; border-radius: 21px; }
.panel-heading { margin-bottom: 18px; }
.ride-options { margin-top: 20px; }
.map-heading { flex-direction: column; }
.map-canvas { min-height: 390px; }
.map-panel { min-height: 590px; }
.map-stats { gap: 14px; justify-content: space-between; }
.map-stats > div:nth-child(3) { display: none; }
.cancel-button { margin-left: 0; }
.history-strip { display: none; }
```

Important: no mobile bottom navigation is currently shown. The desktop rail simply disappears below 700px. Preserve this behavior if matching the current design exactly.

## 15. Interaction/state specification

Use a single React component with these state values:

```ts
const [pickup, setPickup] = useState("Banani");
const [dropoff, setDropoff] = useState("Gulshan");
const [seats, setSeats] = useState(1);
const [rideState, setRideState] = useState<"idle" | "searching" | "matched">("idle");
```

Required interactions:

1. Pickup/drop-off changes update route title, map labels, and fare immediately.
2. Opposite selected location is disabled in each dropdown.
3. Swap exchanges pickup and drop-off.
4. Seat buttons clamp count between 1 and 3.
5. Request begins searching immediately.
6. Searching lasts 1500ms and then changes to matched.
7. Searching disables the request button and shows a spinner.
8. Matched updates title, seats-open copy, ETA, two progress stages, button copy, and live map status.
9. Cancel appears whenever state is not idle and restores idle.
10. Navigation buttons except Home are visual-only in this version.
11. Wallet, avatar, history, and matched ride buttons are visual-only in this version.

## 16. Icon inventory

Use these Lucide icons at the specified locations:

- `Zap`: brand 19px; charge statistic 17px.
- `Home`: nav 19px.
- `Route`: nav 19px.
- `WalletCards`: nav 19px; wallet card 18px.
- `UserRound`: nav 19px.
- `ChevronDown`: wallet 16px; last ride 15px.
- `LocateFixed`: pickup 17px.
- `MapPin`: drop-off 17px.
- `ArrowDownUp`: swap 16px.
- `CarFront`: primary action 19px; moving map car 15px; nearby cars 13px; stat 17px.
- `Navigation`: matched action 18px.
- `History`: last ride 17px.
- `Clock3`: wait statistic 17px.
- `X`: cancel trip 15px.

Do not use emojis for interface icons.

## 17. Accessibility and quality requirements

- Every icon-only button must have an `aria-label`; add `title` where useful.
- Keep visible text readable at all breakpoints without clipping or overlap.
- Keep select controls keyboard accessible.
- Use an actual disabled state while searching.
- Do not remove native focus behavior unless replacing it with a visible focus treatment.
- Respect `prefers-reduced-motion` exactly as specified.
- Avoid cumulative layout shift: use fixed dimensions for icon buttons, markers, avatar, and stats icons.
- Ensure the map clips moving objects with `overflow: hidden`.
- Use `min-width: 0` on flexible/grid children to prevent overflow.

## 18. Metadata

Page title:

`Passenger Dashboard | Dhaka Tesla Pool`

Description:

`Book and track a pooled electric auto ride across Dhaka.`

Open Graph title and description should match. Set `og:type` to `website` and Twitter card to `summary_large_image`.

## 19. Suggested file organization

For a straightforward recreation:

```text
src/
  routes/
    index.tsx        # full passenger dashboard and React state
    __root.tsx       # document shell, CSS and font links
  styles.css         # tokens, layout, component styles, keyframes, breakpoints
```

If using a different React setup, keep the same responsibilities in the equivalent app/page/global-style files. Do not alter visual values when reorganizing code.

## 20. OpenCode execution prompt

Copy this instruction together with the full specification above:

> Recreate the Dhaka Tesla Pool passenger dashboard exactly according to this specification. Treat every stated size, spacing, color formula, breakpoint, animation duration, label, state transition, and icon size as authoritative. Build the functional dashboard, not a landing page. Keep it frontend-only with React state and no real map, payment, authentication, database, or API. Use TypeScript, Lucide icons, Outfit headings, and Figtree body text. Implement all idle, searching, matched, swap, seat, fare, and cancel behavior. Preserve the desktop 88px floating navigation rail and the exact responsive rules. After implementation, verify the page at 1280px desktop, around 900px tablet, and 390px mobile; check for overflow, overlap, clipped text, animation issues, and console errors.

## 21. Acceptance checklist

The recreation is complete only if all checks pass:

- [ ] Warm-white background with subtle upper-left mint glow.
- [ ] Desktop navigation rail is exactly 88px wide with 28px radius.
- [ ] Four 46px navigation buttons and 42px bottom avatar are present.
- [ ] Header copy and compact TeslaPay card match exactly.
- [ ] Desktop main grid uses `.78fr / 1.22fr`, 26px gap.
- [ ] Booking card includes eight Dhaka zones, swap, 1–3 seats, exact fare formula.
- [ ] Initial Banani → Gulshan fare is ৳61.00.
- [ ] Request state becomes searching, then matched after 1500ms.
- [ ] Driver, ETA, progress, seat availability, and live-map status react to state.
- [ ] Simulated map includes grid, three roads, mint dashed route, radar sweep, moving Tesla, three nearby cars, two route labels, and status overlay.
- [ ] Map footer includes fleet, wait, and charge statistics.
- [ ] Cancel appears only outside idle and resets the trip.
- [ ] Entrance animation delays are 0/.08/.16/.24 seconds as specified.
- [ ] Tablet stacks at 1050px; mobile behavior switches at 700px.
- [ ] Reduced-motion behavior is implemented.
- [ ] No backend or real integration has been added.
