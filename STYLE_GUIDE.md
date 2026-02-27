# Pincelada Design System Style Guide

**Design Philosophy:** Editorial magazine meets data visualization — clean typography, generous whitespace on light sections, dark panels with subtle dot-grid textures for visual/data elements, no stock photos, no generic illustrations, with visual interest coming from data graphics, diagrams, and typographic contrast.

---

## 1. Typography Scale

### Font Families
- **Headers:** `DM Serif Display`
- **Body:** `DM Sans`
- **Eyebrows/Labels:** `DM Sans`

### Header Hierarchy
```tsx
// H1 - Hero Headlines
className="text-[56px] md:text-[72px] lg:text-[80px] leading-[1.1] tracking-[-0.02em]"
style={{ fontFamily: 'DM Serif Display' }}

// H2 - Section Headlines
className="text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.02em]"
style={{ fontFamily: 'DM Serif Display' }}

// H3 - Subsection Headlines
className="text-[24px] md:text-[32px] leading-[1.1]"
style={{ fontFamily: 'DM Serif Display' }}

// Body Large
className="text-[18px] md:text-[20px] leading-relaxed"
style={{ fontFamily: 'DM Sans' }}

// Body
className="text-[16px] leading-relaxed"
style={{ fontFamily: 'DM Sans' }}

// Small Text
className="text-[14px]"
style={{ fontFamily: 'DM Sans' }}

// Eyebrow Labels
className="text-[11px] uppercase tracking-[0.15em]"
style={{ fontFamily: 'DM Sans' }}
```

### Typography Guidelines
- **Line Heights:** Headers use `leading-[1.1]`, body text uses `leading-relaxed` (1.625)
- **Letter Spacing:** Headers use `tracking-[-0.02em]`, eyebrows use `tracking-[0.15em]`
- **Font Weight:** Headers are `font-normal` (400), body is regular weight
- **Mobile Responsiveness:** ALL H2 elements MUST include mobile sizing (text-[32px] md:text-[48px]). Never use fixed sizes without breakpoints.

---

## 2. Color System

### Background Colors
```tsx
// Light sections
bg-[#FAF9F6]  // Warm off-white (primary light background)
bg-white      // Pure white (cards, modals)

// Dark sections
bg-[#1e1e2e]  // Navy dark (standard dark background)
bg-[#1f1010]  // Very dark red (optional variant for problem/warning panels)
```

### Text Colors
```tsx
text-[#1A1A1A]    // Primary dark text
text-white         // White text on dark backgrounds
text-gray-600      // Body text on light backgrounds
text-gray-500      // Muted labels/eyebrows
text-[#DC2626]     // Red accent (errors, warnings, emphasis)
text-white/40      // White at 40% opacity (dark section eyebrows)
```

### Gradient (Primary Brand)
```tsx
// Use for CTAs, accent text, and highlights
bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6]
```

### Border Colors
```tsx
border-gray-200      // Light section cards
border-gray-300      // Light section card hover
border-white/10      // Dark section cards
border-[#1A1A1A]     // Outline buttons
```

---

## 3. Grid Texture Overlay

All dark sections (`bg-[#1e1e2e]`) must include this texture overlay:

```tsx
<section className="relative bg-[#1e1e2e]">
  {/* Grid texture overlay - always absolute, inset-0, opacity-[0.02] */}
  <div 
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
      backgroundSize: '24px 24px'
    }}
  />
  
  {/* Content must have relative z-10 */}
  <div className="relative z-10">
    {/* Section content */}
  </div>
</section>
```

**Critical rules:**
- Overlay is always `absolute inset-0` 
- Opacity is always `opacity-[0.02]`
- Dot size: `1px`, spacing: `24px`
- Content wrapper must have `relative z-10` to appear above texture

---

## 4. Button System

### Primary Button (Gradient)
```tsx
<button className="px-8 py-3 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white rounded-full hover:opacity-90 transition-opacity">
  Button Text
</button>
```

**Properties:**
- Shape: `rounded-full` (pill shape)
- Padding: `px-8 py-3`
- Gradient: Purple → Indigo → Blue
- Hover: `hover:opacity-90`
- Transition: `transition-opacity`

### Secondary Button (Outline)
```tsx
<button className="px-8 py-3 border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all">
  Button Text
</button>
```

### Ghost Button (Dark Backgrounds)
```tsx
<button className="px-8 py-3 border-2 border-white text-white rounded-full hover:bg-white hover:text-[#1e1e2e] transition-all">
  Button Text
</button>
```

**Button Guidelines:**
- All buttons are `rounded-full`
- Standard padding: `px-8 py-3`
- Always include transition effects
- Use primary gradient for main CTAs
- Use outline for secondary actions

---

## 5. Section Layout Patterns

### Light Section Template
```tsx
<section className="bg-[#FAF9F6] py-16 md:py-24 lg:py-32">
  <div className="max-w-[1200px] mx-auto px-6 md:px-12">
    {/* Eyebrow */}
    <div 
      className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-4"
      style={{ fontFamily: 'DM Sans' }}
    >
      SECTION LABEL
    </div>
    
    {/* H2 Headline */}
    <h2 
      className="text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A] mb-8 md:mb-10"
      style={{ fontFamily: 'DM Serif Display' }}
    >
      Section Headline
    </h2>
    
    {/* Body Content */}
    <p 
      className="text-[18px] md:text-[20px] leading-relaxed text-gray-600 mb-12"
      style={{ fontFamily: 'DM Sans' }}
    >
      Section description or introduction text.
    </p>
    
    {/* Section-specific content */}
  </div>
</section>
```

### Dark Section Template
```tsx
<section className="relative bg-[#1e1e2e] py-16 md:py-24 lg:py-32 overflow-hidden">
  {/* Grid texture overlay */}
  <div 
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
      backgroundSize: '24px 24px'
    }}
  />
  
  <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
    {/* Eyebrow */}
    <div 
      className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4"
      style={{ fontFamily: 'DM Sans' }}
    >
      SECTION LABEL
    </div>
    
    {/* H2 Headline */}
    <h2 
      className="text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.02em] text-white mb-8 md:mb-10"
      style={{ fontFamily: 'DM Serif Display' }}
    >
      Section Headline
    </h2>
    
    {/* Body Content */}
    <p 
      className="text-[18px] md:text-[20px] leading-relaxed text-white/80 mb-12"
      style={{ fontFamily: 'DM Sans' }}
    >
      Section description or introduction text.
    </p>
    
    {/* Section-specific content */}
  </div>
</section>
```

---

## 6. Card Components

### Light Section Card
```tsx
<div className="bg-white rounded-lg p-6 md:p-8 border border-gray-200 hover:border-gray-300 transition-colors">
  <h3 
    className="text-[24px] md:text-[32px] leading-[1.1] text-[#1A1A1A] mb-4"
    style={{ fontFamily: 'DM Serif Display' }}
  >
    Card Title
  </h3>
  <p 
    className="text-[16px] leading-relaxed text-gray-600"
    style={{ fontFamily: 'DM Sans' }}
  >
    Card content text.
  </p>
</div>
```

### Dark Section Card (Frosted Glass)
```tsx
<div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 md:p-8 border border-white/10 hover:border-white/20 transition-colors">
  <h3 
    className="text-[24px] md:text-[32px] leading-[1.1] text-white mb-4"
    style={{ fontFamily: 'DM Serif Display' }}
  >
    Card Title
  </h3>
  <p 
    className="text-[16px] leading-relaxed text-white/80"
    style={{ fontFamily: 'DM Sans' }}
  >
    Card content text.
  </p>
</div>
```

**Card Guidelines:**
- Always use `rounded-lg`
- Standard padding: `p-6 md:p-8`
- Include hover states on borders
- Use `backdrop-blur-sm` for frosted glass effect on dark backgrounds

---

## 7. Data Visualization Style

All charts, graphs, and data visualizations must follow this aesthetic:

### Frosted-Glass Semi-Transparent Fills
```tsx
// SVG chart fills
fill="rgba(139, 92, 246, 0.15)"   // 15% opacity purple
stroke="rgba(139, 92, 246, 0.5)"  // 50% opacity purple border
strokeWidth={2}

// Alternative colors
fill="rgba(99, 102, 241, 0.15)"   // Indigo
fill="rgba(59, 130, 246, 0.15)"   // Blue
fill="rgba(220, 38, 38, 0.15)"    // Red (for warnings/problems)
```

### Chart Container
```tsx
<div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
  {/* SVG or canvas visualization */}
</div>
```

**Visualization Guidelines:**
- No solid fills — always use semi-transparent rgba values
- Stroke opacity higher than fill opacity for definition
- Use brand gradient colors (purple, indigo, blue)
- Red accent for problems/warnings
- Always wrap in frosted glass containers on dark backgrounds

---

## 8. Gradient Text Effect

For italic accent words within headlines:

```tsx
<h2 
  className="text-[32px] md:text-[48px] leading-[1.1] text-[#1A1A1A]"
  style={{ fontFamily: 'DM Serif Display' }}
>
  Regular headline text{' '}
  <span 
    className="italic bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent"
    style={{ fontFamily: 'DM Serif Display' }}
  >
    gradient accent
  </span>
</h2>
```

**Usage:**
- Emphasize key words or phrases in headlines
- Always use italic variant
- Keep font family consistent with parent element
- Works on both light and dark backgrounds

---

## 9. Spacing Scale

### Section Spacing
```tsx
// Section padding (vertical)
py-16 md:py-24 lg:py-32

// Container padding (horizontal)
px-6 md:px-12
```

### Element Spacing (margin-bottom)
```tsx
// Small spacing
mb-4 md:mb-6

// Medium spacing
mb-8 md:mb-10

// Large spacing
mb-12 md:mb-16

// Extra large spacing
mb-16 md:mb-20 lg:mb-24
```

### Grid Gaps
```tsx
// Cards/items grid
gap-6 md:gap-8 lg:gap-12
```

---

## 10. Container Max-Widths

```tsx
// Standard content (most sections)
max-w-[1200px] mx-auto

// Narrow content (CTAs, centered intros)
max-w-[700px] mx-auto

// Wide content (case studies, full-bleed sections)
max-w-[1400px] mx-auto

// Extra narrow (modal content, forms)
max-w-[600px] mx-auto
```

---

## 11. Responsive Breakpoints

```tsx
// Mobile (base styles)
< 768px - No prefix

// Tablet
768px - 1024px - md: prefix

// Desktop
1440px+ - lg: prefix
```

### Responsive Strategy
- Mobile-first approach (base styles are mobile)
- Use `md:` for tablet and up
- Use `lg:` for desktop enhancements only when needed
- Always test at: 375px (mobile), 768px (tablet), 1440px (desktop)

---

## 12. Animation Patterns

### Fade-In on Scroll
Use the `FadeInSection` component wrapper for elements that should animate in:

```tsx
import { FadeInSection } from './components/FadeInSection';

<FadeInSection>
  <h2>This will fade in when scrolled into view</h2>
</FadeInSection>
```

### Button Hover Animations
```tsx
// Opacity fade
transition-opacity hover:opacity-90

// Full transition (background, border, text color)
transition-all hover:bg-[color] hover:text-[color]

// Scale effect (subtle)
transition-transform hover:scale-105
```

**Animation Guidelines:**
- Use `FadeInSection` for major content blocks
- Keep transitions subtle and fast (default duration)
- Avoid over-animating — editorial aesthetic is calm and confident

---

## 13. Image Guidelines

### Image Import Pattern
```tsx
// Use ImageWithFallback component for all images
import { ImageWithFallback } from './components/figma/ImageWithFallback';

<ImageWithFallback 
  src="https://images.unsplash.com/..." 
  alt="Descriptive alt text"
  className="w-full h-auto rounded-lg"
/>
```

### Image Style
- **No stock photos of people in generic office settings**
- **No generic illustrations or clipart**
- Use Unsplash for: architecture, abstract patterns, texture details, technology close-ups
- Prefer: geometric, architectural, minimal, high-contrast images
- Always apply `rounded-lg` to images

---

## 14. Form Elements

### Input Fields
```tsx
<input
  type="text"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors"
  style={{ fontFamily: 'DM Sans' }}
/>
```

### Textarea
```tsx
<textarea
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors resize-none"
  rows={4}
  style={{ fontFamily: 'DM Sans' }}
/>
```

### Form Layout
```tsx
<form className="space-y-6">
  <div>
    <label className="block text-[14px] text-gray-600 mb-2" style={{ fontFamily: 'DM Sans' }}>
      Label Text
    </label>
    <input {...} />
  </div>
  
  <button className="w-full px-8 py-3 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white rounded-full">
    Submit
  </button>
</form>
```

---

## 15. Modal Pattern

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
  <div className="bg-white rounded-lg max-w-[600px] w-full max-h-[90vh] overflow-y-auto">
    <div className="p-8 md:p-12">
      <h2 
        className="text-[32px] md:text-[40px] leading-[1.1] text-[#1A1A1A] mb-6"
        style={{ fontFamily: 'DM Serif Display' }}
      >
        Modal Title
      </h2>
      
      {/* Modal content */}
      
      <button 
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  </div>
</div>
```

---

## 16. Icon Usage

### Lucide React Icons
```tsx
import { ArrowRight, Check, X } from 'lucide-react';

// Standard size
<ArrowRight className="w-5 h-5" />

// Large size
<ArrowRight className="w-6 h-6" />

// With color
<Check className="w-5 h-5 text-green-500" />
```

**Icon Guidelines:**
- Use `lucide-react` for all icons
- Standard size: `w-5 h-5` (20px)
- Keep icon usage minimal and purposeful
- Icons should support meaning, not replace text

---

## 17. Navigation Pattern

### Desktop Navigation
```tsx
<nav className="bg-white border-b border-gray-200">
  <div className="max-w-[1400px] mx-auto px-6 md:px-12">
    <div className="flex items-center justify-between h-20">
      {/* Logo */}
      <div className="text-[24px]" style={{ fontFamily: 'DM Serif Display' }}>
        Pincelada
      </div>
      
      {/* Nav links */}
      <div className="flex items-center gap-8">
        <a 
          href="#" 
          className="text-[16px] text-[#1A1A1A] hover:text-[#7C3AED] transition-colors"
          style={{ fontFamily: 'DM Sans' }}
        >
          Link
        </a>
      </div>
      
      {/* CTA */}
      <button className="px-6 py-2 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white rounded-full">
        Contact
      </button>
    </div>
  </div>
</nav>
```

---

## 18. Footer Pattern

```tsx
<footer className="bg-[#1e1e2e] py-12 md:py-16">
  <div className="max-w-[1200px] mx-auto px-6 md:px-12">
    <div className="grid md:grid-cols-4 gap-8 mb-12">
      {/* Footer columns */}
    </div>
    
    <div className="border-t border-white/10 pt-8 text-center">
      <p className="text-[14px] text-white/40" style={{ fontFamily: 'DM Sans' }}>
        © 2025 Pincelada. All rights reserved.
      </p>
    </div>
  </div>
</footer>
```

---

## 19. Accessibility Guidelines

- All buttons must have descriptive text or `aria-label`
- Images must have meaningful `alt` text
- Maintain color contrast ratios (WCAG AA minimum)
- Forms must have associated labels
- Interactive elements must be keyboard accessible
- Focus states must be visible

---

## 20. Don'ts

❌ **Never use:**
- Stock photos of people in generic office settings
- Generic illustrations or clipart
- Solid fills in data visualizations (always semi-transparent)
- Different button shapes (always `rounded-full`)
- Mulish for body text (use DM Sans)
- Inconsistent dark backgrounds (always `#1e1e2e` unless specific variant needed)

❌ **Avoid:**
- Over-animating elements
- Using more than 2-3 font sizes in a single section
- Mixing gradient directions (always `bg-gradient-to-br`)
- Creating custom grid textures (use the standard 24px pattern)

---

## Quick Reference Checklist

When creating a new section, verify:

- [ ] Correct font families (DM Serif Display for headers, DM Sans for body)
- [ ] Responsive typography (mobile and desktop sizes)
- [ ] Proper spacing (`py-16 md:py-24 lg:py-32` for sections)
- [ ] Grid texture on dark sections
- [ ] `relative z-10` on content in dark sections
- [ ] Gradient buttons are `rounded-full` with correct gradient
- [ ] Semi-transparent fills in any data visualizations
- [ ] FadeInSection wrapper for main content blocks
- [ ] Proper container max-width (`1200px` standard)
- [ ] Eyebrow labels use DM Sans, uppercase, tracking-[0.15em]

---

**Last Updated:** February 14, 2025  
**Design System Version:** 1.0  
**Maintained by:** Pincelada Team