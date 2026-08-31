# Synora Shop UI (`synora-shop-ui`)

Frontend repository for the **Synora Shop** multi-tenant e-commerce platform.

---

## 📦 What's Inside

- **Storefront Application (`app/(storefront)`)**:
  - Customer shopping experience: Catalog, Collections, Product Details (`/p/[slug]`), Cart, and Checkout.
  - Customer Accounts (`/account`) & Order Confirmation (`/order-confirmation/[id]`).
  - Region & Country switcher, Announcements, and Navigation Menus.
- **Merchant Admin Portal (`app/admin`)**:
  - Multi-tenant Merchant Dashboard: Catalog management, Orders, Inventory, Discounts, Categories, and Domains.
  - Staff management & Role-based Access Control (RBAC).
  - Store configuration & Region rules.
- **Live Theme Customizer (`app/(fullscreen)/admin/customizer`)**:
  - Split-screen live visual theme customizer with real-time postMessage protocol (`lib/customizer-protocol.ts`).
  - Schema-driven settings controls dynamically rendered from theme `settings_schema.json`.
- **Platform Marketing (`app/(platform)`)**:
  - Landing page (`/home`) and merchant onboarding flows (`app/merchant/*`).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI & State**: React 19, Zustand
- **Styling**: Tailwind CSS v4, PostCSS
- **Icons**: Lucide React
- **Language**: TypeScript

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔗 Related Repositories

- **Backend API & Data Layer**: [`synora-shop-api`](https://github.com/synora-shop/synora-shop-api)
