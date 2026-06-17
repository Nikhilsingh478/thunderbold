---
name: Mobile UX Architecture
description: Bottom nav, simplified navbar, sticky bars — key decisions for mobile layout.
---

## Bottom Navigation (`src/components/BottomNav.tsx`)
- 4 tabs: Home (`/`), Cart (`/cart`), Wishlist/Saved (`/wishlist`), Account/Login (`/profile`)
- `md:hidden` — only renders on mobile viewports
- Returns `null` for `/admin` and `/checkout` routes (focus mode on checkout, no nav on admin)
- Mounted inside `<BrowserRouter>` in `AppContent.tsx` so `useLocation()` works
- Height: `h-[52px]` — all sticky bars/strips that need to sit above it use `bottom-[52px]`
- Safe area: `paddingBottom: 'env(safe-area-inset-bottom)'` in inline style (iOS notch support)

**Why:** Bottom nav is the single biggest mobile UX win for e-commerce — keeps Cart, Wishlist, Account thumb-reachable without opening a menu.

**How to apply:** Any new fixed-bottom element on mobile must use `bottom-[52px]` not `bottom-0`, or it will overlap the bottom nav.

## Navbar Mobile Simplification (`src/components/Navbar.tsx`)
- Mobile header right now has only: Search button (opens SearchOverlay) + Hamburger
- Cart, Wishlist, Profile/Login icons removed from mobile header — they live in the bottom nav
- Hamburger menu (full-screen overlay) simplified to: Categories, Brands, About Us, Policies + Logout (if logged in)
- Profile/Orders/Login removed from hamburger — bottom nav handles them
- "Brands" added to baseLinks so it shows in both desktop nav and hamburger menu

**Why:** Removing duplicate icons from the navbar top bar reduces cognitive load. The hamburger is now for secondary navigation only.

## ProductView Sticky Buy Bar
- Changed from `bottom-0` to `bottom-[52px]` — sits above the bottom nav
- `z-[100]` — above bottom nav's `z-[80]`

## Cart Page (`src/pages/Cart.tsx`)
- Mobile sticky checkout strip: `fixed bottom-[52px] z-[75] md:hidden` — shows when cart has items
- Contains: item count label + total price + "Checkout" button
- Main `pb-` uses inline style `paddingBottom: 'calc(124px + env(safe-area-inset-bottom))'` when cart has items to clear both the bottom nav (52px) and the checkout strip (~56px)
- Cart header simplified: just "Cart (N)" + "Clear" button

## Admin Panel Tabs
- Tab buttons: `hidden sm:inline` hides label text on mobile — icons only on xs screens
- Tab buttons: `px-3.5 sm:px-6` and `py-3.5 sm:py-3` — larger tap targets on mobile
- Icon size: `w-[17px] h-[17px] sm:w-3.5 sm:h-3.5` — slightly larger icons on mobile
- `title={label}` — browser tooltip on hover/long-press

## Page Bottom Padding
All existing pages use `pb-24` (96px) which exceeds the 52px bottom nav height — no changes needed to other pages. Admin uses `pb-16` but bottom nav is hidden on /admin.
