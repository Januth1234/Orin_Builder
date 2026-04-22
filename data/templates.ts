import { SiteTemplate } from '../types';

/**
 * Remixed templates inspired by modern landing page patterns.
 * Each prompt is detailed enough for the orchestrator to generate
 * a compelling, complete website.
 */
export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: 'saas-gradient',
    name: 'SaaS Gradient',
    description: 'Dark gradient hero, feature grid, pricing tiers, and testimonials — the classic SaaS formula.',
    category: 'saas',
    accentColor: '#6366f1',
    bgColor: '#0f0f1a',
    tags: ['dark', 'gradient', 'pricing', 'features'],
    prompt: 'Build a SaaS landing page with a dark gradient hero section featuring a bold headline and email capture CTA, a 3-column feature grid with icons, a 3-tier pricing section (Free/Pro/Enterprise), social proof logos row, a testimonials carousel, and a sticky nav with a "Get Started" CTA button. Use a deep dark navy background with indigo/purple gradient accents. Fully responsive with smooth scroll animations.',
  },
  {
    id: 'agency-bold',
    name: 'Agency Bold',
    description: 'High-contrast agency site with large type, project showcases, and strong CTAs.',
    category: 'agency',
    accentColor: '#f97316',
    bgColor: '#111111',
    tags: ['bold', 'portfolio', 'dark', 'typography'],
    prompt: 'Build a bold creative agency website with extra-large display typography, a full-bleed hero with a rotating text tagline, a work/case-studies grid showing 6 project cards with hover overlays, a services section with alternating image/text layout, a team section, client logo strip, and a large footer CTA. Black background with orange accent. Mobile-first, high contrast, minimal animations.',
  },
  {
    id: 'startup-clean',
    name: 'Startup Clean',
    description: 'Light, airy startup page with product screenshots, trust badges, and clear CTAs.',
    category: 'startup',
    accentColor: '#22c892',
    bgColor: '#ffffff',
    tags: ['light', 'clean', 'minimal', 'product'],
    prompt: 'Build a clean startup landing page with a white background and green accents. Include a centered hero with headline, subheadline, two CTA buttons (primary filled, secondary outline), a mock app screenshot below the fold, a row of "trusted by" company logos, a 4-step how-it-works section, a features comparison table, an FAQ accordion, and a minimal footer. Use Inter font. Subtle drop shadows and border-radius everywhere.',
  },
  {
    id: 'portfolio-minimal',
    name: 'Portfolio Minimal',
    description: 'Personal portfolio with project cards, skills, and a contact form.',
    category: 'portfolio',
    accentColor: '#0ea5e9',
    bgColor: '#0c111b',
    tags: ['dark', 'minimal', 'personal', 'grid'],
    prompt: 'Build a minimal dark portfolio website for a software engineer. Include a hero with name, role, and animated typing effect for specialties, a projects grid with 6 card items (image, title, tech stack badges, live/GitHub links), a skills section grouped by category (Frontend, Backend, Tools), a brief about section with a timeline of experience, and a contact form. Dark theme with subtle blue-cyan glow accents. Monospace font for code elements.',
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'Product-focused store front with featured items, categories, and promotional banners.',
    category: 'ecommerce',
    accentColor: '#f43f5e',
    bgColor: '#fafafa',
    tags: ['light', 'shop', 'products', 'modern'],
    prompt: 'Build a modern e-commerce store homepage with a full-width promotional hero banner with countdown timer, a horizontal category scroll row (6 categories with icons), a featured products grid (8 cards with image, name, price, rating, add-to-cart button), a "New Arrivals" section, a trust strip (free shipping, 30-day returns, secure checkout, 24/7 support), and a newsletter signup. Light background with rose/red accent buttons. Sticky header with cart icon.',
  },
  {
    id: 'blog-editorial',
    name: 'Blog Editorial',
    description: 'Editorial blog with featured article, recent posts, categories, and newsletter.',
    category: 'blog',
    accentColor: '#d97706',
    bgColor: '#fffbf5',
    tags: ['warm', 'editorial', 'content', 'readable'],
    prompt: 'Build an editorial blog homepage with a warm off-white background. Include a large featured article hero with overlaid title and author info, a 3-column recent articles grid with thumbnail, category badge, title, excerpt, and read time, a "Popular this week" sidebar section, a topics/categories cloud, an email newsletter signup with warm styling, and a minimal footer. Amber/gold accents, serif headings (Playfair Display), body text in Inter. Maximum readability.',
  },
  {
    id: 'saas-dashboard-promo',
    name: 'Dashboard Promo',
    description: 'Showcase a dashboard product with live UI mockups, feature callouts, and onboarding flow.',
    category: 'saas',
    accentColor: '#8b5cf6',
    bgColor: '#060714',
    tags: ['dark', 'dashboard', 'product', 'animated'],
    prompt: 'Build a SaaS product page for a data analytics dashboard. Include a dark hero with purple glow, browser-frame mock of a dashboard UI (built in HTML/CSS), a scrolling feature list where each item has an icon + title + description on the left and a UI detail screenshot on the right, an integration logos section, customer metrics stats (users, data processed, uptime), a pricing toggle (monthly/yearly), and an animated gradient CTA section. Deep space dark theme.',
  },
  {
    id: 'restaurant-luxury',
    name: 'Restaurant Luxury',
    description: 'Elegant restaurant site with full-screen food photography, menu, and reservations.',
    category: 'saas',
    accentColor: '#d4af37',
    bgColor: '#0d0d0d',
    tags: ['dark', 'luxury', 'food', 'elegant'],
    prompt: 'Build a luxury restaurant website with a full-screen dark hero, elegant serif typography, a horizontal menu preview with dish names and prices, a chef story section with portrait and quote, a gallery masonry grid with 6 food images (placeholder CSS art), a reservations form, opening hours, and location. Near-black background with gold (#d4af37) accents. Cormorant Garamond headings, clean body text. No Lorem Ipsum — use real restaurant copy.',
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'saas',      label: 'SaaS' },
  { id: 'agency',    label: 'Agency' },
  { id: 'startup',   label: 'Startup' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'blog',      label: 'Blog' },
] as const;
