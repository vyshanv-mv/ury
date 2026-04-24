# Design System: URY POS

This document defines the semantic design system for the URY POS application, ensuring visual consistency across the onboarding flow and the main Desk interface.

## 1. Visual Theme & Atmosphere
The URY POS aesthetic is **Premium, Modular, and Functional**. It prioritizes a high-end "native app" feel through the use of generous whitespace, soft depth, and clean geometry. The atmosphere is designed to convey reliability and ease of use in a fast-paced restaurant environment.

- **Mood**: Airy yet authoritative.
- **Density**: Comfortable spacing with a focus on readability and touch-friendly targets.
- **Key Visual Cues**: Backdrop blurs, subtle gradients, and high-quality shadows.

## 2. Color Palette & Roles

| Color Name | Hex Code | Functional Role |
| :--- | :--- | :--- |
| **Brand Blue** | `#2563EB` | Primary actions, branding elements, and progress indicators. |
| **Success Emerald** | `#10B981` | Positive feedback, "Verified" states, and completed steps. |
| **Alert Amber** | `#F59E0B` | Warnings and pending notifications. |
| **Deep Onyx** | `#111827` | Primary headings and high-emphasis text. |
| **Slate Gray** | `#4B5563` | Body text and secondary descriptions. |
| **Ghost Gray** | `#F9FAFB` | Main application background and subtle sectioning. |
| **Pure White** | `#FFFFFF` | Primary cards, containers, and dialog surfaces. |

## 3. Typography Rules
The system uses **Inter** as the primary typeface, leveraging its technical clarity and modern feel.

- **Headings**: `font-black` (900) or `font-bold` (700) with `tracking-tight` (-0.025em) for a grounded, authoritative look.
- **Body Text**: `font-medium` (500) for general interface elements; `opacity-60` to `opacity-80` for secondary descriptions.
- **Micro-copy**: `uppercase tracking-widest` for small labels (e.g., sidebar category headers).

## 4. Component Stylings

### **Header**
- **Style**: Sticky top positioning with `backdrop-blur-md` and `bg-white/80`.
- **Branding**: Centralized logo on mobile, left-aligned on desktop with integrated user profile management.

### **Cards & Containers**
- **Geometry**: Generously rounded corners (`rounded-2xl` for standard cards, `rounded-[2rem]` for premium onboarding surfaces).
- **Depth**: `shadow-xl` or `shadow-2xl` with subtle blue-tinted ambient occlusion (`shadow-blue-100/50`).
- **Borders**: Thin, high-contrast borders (`border-gray-100`) to define boundaries on white surfaces.

### **Buttons**
- **Primary**: Full width on mobile, high-contrast text, `shadow-lg` on hover.
- **Ghost/Outline**: Used for secondary actions (e.g., "Previous Step") to maintain visual hierarchy.

## 5. Layout Principles
- **Container Strategy**: Maximum widths for content areas (`max-w-5xl`) to ensure readability on large displays.
- **Responsive Grid**: Sidebar-driven navigation for complex configuration; centralized, vertical flow for simple loading/success states.
- **Section Rhythm**: Vertical spacing using standardized Tailwind units (e.g., `py-12`, `mb-12`) to create a predictable visual cadence.
