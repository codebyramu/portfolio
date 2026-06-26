# DESIGN.md - RAMU Portfolio

## 1. Visual Theme & Atmosphere
- **Philosophy**: Steve Jobs–era restraint meets modern creative development.
- **Atmosphere**: Deep, cinematic, minimal, and immersive.
- **Tagline**: "Code. Music. Craft."

## 2. Color Palette & Roles
```css
:root {
  --bg-color: #0a0a0a; /* Deep dark background */
  --text-color: #f0f0f0; /* Primary text */
  --accent-gold: #c9a84c; /* Signature accent */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.05);
  --stereo-shadow: -5px -5px 15px rgba(255, 255, 255, 0.02), 5px 5px 15px rgba(0, 0, 0, 0.8);
}
```

## 3. Typography Rules
- **Headings**: Space Grotesk (Weights: 300, 500, 700)
- **Body**: Outfit (Weights: 200, 400, 600, 800)
- **Scale**: H1 (4rem), H2 (3rem), H3 (1.5rem), Body (1rem)

## 4. Component Stylings
- **.stereo-card**: Combines neumorphic/stereomorphic shadows with dark surfaces. Lifts on hover.
- **.glass-card**: Subtle blur (16px) with ultra-low opacity white background.
- **Buttons**: Gold primary button, subtle bordered secondary button.

## 5. Layout Principles
- **Grid**: Flex and CSS Grid used for content distribution.
- **Spacing**: 100px section paddings, 40px component gaps.
- **Max Width**: Content constrained for readability.

## 6. Depth & Elevation
- **Level 1**: WebGL liquid distortion background.
- **Level 2**: Glassmorphic navigation and panels.
- **Level 3**: Stereomorphic raised cards.

## 7. Animation & Interaction (L3 Level)
- **Smooth Scroll**: Lenis
- **Scroll Reveal**: GSAP ScrollTrigger stagger fades
- **Hero**: CSS Glitch text animation
- **Background**: Three.js WebGL fragment shader responding to `uMouse`
- **Micro-interactions**: Hover lifts, custom cursor, spotlight cards.

## 8. Do's and Don'ts
- **Do**: Use restraint with the gold accent.
- **Do**: Keep animations running at 60fps.
- **Do**: Maintain deep contrast.
- **Don't**: Use bright neon colors or gradients.
- **Don't**: Overuse blur (keep `backdrop-filter` localized).
- **Don't**: Add unmotivated animations.
- **Don't**: Rely on pure black (#000000) for large backgrounds, use #0a0a0a.

## 9. Responsive Behavior
- **Mobile**: Grid templates shift to 1fr, font sizes scale down (H1 to 2.5rem).
- **Touch**: WebGL mouse interactions gracefully degrade or center.
