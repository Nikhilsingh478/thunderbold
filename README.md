# ⚡ Thunderbolt Brand World
An ultra-premium, cinematic e-commerce web application specifically engineered for a high-end denim brand. 

Featuring an immersive "Void and Brass" dark mode aesthetic, a non-laggy full-screen search overlay, fluid page navigation via React Router, dynamic swipeable product carousels, and an intelligent direct-to-WhatsApp checkout system.

---

## 🚀 Core Features & Mechanics

* **Cinematic Dark-Mode UX:** Polished "Void and Brass" color system emphasizing minimalist luxury. It utilizes advanced typography effects across the site including Ghost outlines, custom metal gradients, and strict custom tracking (`.font-display`) overrides to present the `Bebas Neue` font perfectly.
* **Instant Global Search Overlay:** A sleek, physics-based full-screen search overlay. Features auto-focusing inputs and real-time live filtering against the local database, allowing customers to locate specific fits (e.g., *Bootcut*, *Baggy*) instantly with zero server lag.
* **Multi-Page Architecture:** Seamless single-page-app (SPA) routing handling:
  * The main categories hub (`/`)
  * Deep immersive legacy brand-lore (`/about`)
  * Dynamic category grids (`/category/:id`)
  * Full-screen interactive product inspectors (`/product/:id`)
* **"Awwwards-Level" Error Handling:** Replaced generic browser error pages with a beautifully designed, immersive `404` NotFound component featuring cinematic scaling animations, floating dust accents, and a perfectly stylized fallback CTA button.
* **Sleek Product Presentation:** 
  * Responsive e-commerce grids that adapt intrinsically from desktop (multi-column) to mobile views natively.
  * E-commerce app mechanics: Image carousels cleanly integrated via `framer-motion` and `embla-carousel-react` for smooth, physics-based swiping perfectly suited for mobile interactions.
* **Smart WhatsApp Direct Checkout:** An intelligent shopping cart alternative. Once a user clicks "Order Now", a meticulously formatted markdown payload is generated automatically triggering WhatsApp. It dynamically injects bolded text, formatting emojis, the specific product details (Size, Price, Quantity), and physically embeds the exact `window.location.href` to help sellers immediately identify requested items without requiring a massive backend database
* **Vercel Ecosystem Integration:** Pre-configured `vercel.json` SPA routing rewrites that ensure shared deep links load safely without arbitrary `404: NOT_FOUND` edge server errors.
* **Social Discovery Ready:** Hardcoded OpenGraph (`og:image`, `og:title`) metadata securely piped into the `index.html` headers so links shared on WhatsApp, Facebook, or Instagram beautifully render the Thunderbolt brand tile rather than default React boilerplates.

---

## 🛠️ Technology Stack
* **Frontend Framework:** React 18
* **Build Tool:** Vite (for near-instant compilation)
* **TypeScript:** Strictly typed components, properties, and data pipelines
* **Styling Engine:** Tailwind CSS + highly detailed global CSS overrides
* **Animation Library:** Framer Motion (for physics-based transitions)
* **Interactive Elements:** Embla Carousel React (for swipe mechanics)
* **Routing System:** React Router DOM (v6)
* **Iconography:** Lucide-React

---

## 🏗️ Project Architecture

The repository is built strictly for long-term scalability. 

### Data Layer (`src/data/products.ts`)
The absolute brain of the application. It contains the primary `CATEGORIES` mapping, `SIZES` allocations, an internal asset image dictionary (`CATEGORY_IMAGES`), and dynamically supplies and constructs instances of `Product` objects across the entire store. If pivoting to Shopify/Sanity CMS later, this file is the singular integration point required.

### Key Pages (`src/pages/`)
* `Index.tsx`: The primary route (`/`). Currently repurposed as the primary entry point to access fits.
* `About.tsx`: The visceral homepage experience detailing brand history.
* `CategoryView.tsx`: The dynamically hydrated catalog filtering fits (`/category/:categoryId`).
* `ProductView.tsx`: The detailed product inspector generating the layout for `/product/:productId`.

### Structural Components (`src/components/`)
* `Navbar.tsx` & `Footer.tsx`: Global navigation containers holding mobile states and the Search trigger.
* `SearchOverlay.tsx`: The high-performance, real-time client-side search engine and UI overlay.
* `ScrollProgress.tsx`: A visceral visual indicator for long scrolling pages.

---

## 📦 Local Setup Instructions

To run this application locally on your machine and iterate on designs:

1. **Install Dependencies**
   Ensure you have Node installed, then fetch package requirements:
   ```bash
   npm install
   ```

2. **Start the Development Server**
   Spin up Vite's incredibly fast iterative localhost server:
   ```bash
   npm run dev
   ```

3. **Production Compilation**
   To produce the optimal minified assets required for real-world deployment:
   ```bash
   npm run build
   ```
   *This outputs mathematically optimized static client bundles securely into the `/dist` deployment directory.*
