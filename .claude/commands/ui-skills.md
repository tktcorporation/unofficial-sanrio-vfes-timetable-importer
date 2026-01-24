---
name: ui-skills
description: Opinionated constraints for building better interfaces with agents. Prevents common AI design pitfalls and ensures UX-first development.
---

# UI Skills

When invoked, apply these opinionated constraints for building better interfaces.

## How to use

- `/ui-skills`
  Apply these constraints to any UI work in this conversation.

- `/ui-skills <file>`
  Review the file against all constraints below and output:
  - violations (quote the exact line/snippet)
  - why it matters (1 short sentence)
  - a concrete fix (code-level suggestion)

---

## Core Philosophy

These principles override all other rules when in conflict.

1. **Function over form** - Every visual element must serve a purpose. If you can't explain what task it helps the user accomplish, remove it.
2. **Consistency over novelty** - Match existing patterns first. New patterns require explicit justification.
3. **Reduction over addition** - The best design change is often removing something. Default to "don't add."
4. **User task over interface task** - Optimize for completing user goals, not for interface impressiveness.

### Decision Priority (when in doubt)

1. Does it help the user complete their task faster?
2. Does it match existing patterns in the codebase?
3. Does it reduce cognitive load?
4. Is it the simplest solution?

If the answer to any is "no," reconsider the approach.

---

## Pre-Implementation Checklist

**MUST complete before writing any UI code:**

### 1. Understand the Context
- [ ] What is the user trying to accomplish? (user goal, not feature goal)
- [ ] What existing UI patterns does this project already use?
- [ ] What components already exist that could be reused?

### 2. Check Existing Patterns
```bash
# Before creating new styles, search for existing patterns:
grep -r "className.*btn" app/
grep -r "kawaii-" app/app.css
```
- [ ] Reviewed existing component styles in `app/app.css`
- [ ] Checked `app/components/ui/` for reusable primitives
- [ ] Identified which existing patterns to follow

### 3. Scope the Change
- [ ] This change touches only what was requested (no "improvements")
- [ ] No new colors, spacing, or design tokens introduced unless required
- [ ] No new component patterns when existing ones work

---

## UX Principles

### Information Hierarchy
- MUST establish clear visual hierarchy (what should users see first, second, third?)
- MUST make primary actions visually prominent, secondary actions subdued
- NEVER give equal visual weight to unequal importance
- SHOULD use size, color, and spacing to communicate importance (not decoration)

### Cognitive Load
- MUST minimize choices presented at once (aim for 3-5 options visible)
- MUST group related actions together
- NEVER require users to remember information across screens
- SHOULD show current state clearly (selected items, progress, mode)
- SHOULD use progressive disclosure for complex features

### Task Flow
- MUST support the user's mental model of the task
- MUST provide clear "what's next" at every step
- NEVER dead-end the user (always provide a path forward or back)
- SHOULD minimize steps to complete common tasks
- SHOULD preserve user input on errors (never clear forms on validation failure)

### Feedback & Affordance
- MUST indicate interactive elements clearly (buttons look clickable)
- MUST provide immediate feedback for all user actions (< 100ms visual response)
- MUST show loading states for operations > 300ms
- NEVER use identical styling for interactive and non-interactive elements
- SHOULD indicate disabled states clearly with reduced opacity or muted colors

---

## AI Anti-patterns

**These are patterns AI commonly produces that harm UX. Explicitly forbidden:**

### Visual Design
- NEVER add gradients unless the design system uses them or explicitly requested
- NEVER use purple/blue multicolor gradients (classic AI aesthetic)
- NEVER add glow, shimmer, or neon effects
- NEVER add decorative shadows beyond the design system's scale
- NEVER introduce new accent colors (use existing palette only)
- NEVER add icons "for decoration" (icons must aid comprehension)
- NEVER add borders to everything (use spacing and background instead)

### Over-engineering
- NEVER add hover effects that weren't requested
- NEVER add animations that weren't requested
- NEVER add "nice to have" features while implementing a specific request
- NEVER refactor surrounding code while making a targeted change
- NEVER add configuration options that weren't requested
- NEVER create abstractions for single-use components

### Inconsistency
- NEVER mix design patterns within the same view
- NEVER introduce new spacing values (use existing scale)
- NEVER introduce new border-radius values (use existing scale)
- NEVER create one-off component styles for reusable patterns
- NEVER ignore the existing component library to build from scratch

### Anti-UX
- NEVER prioritize visual impressiveness over task completion
- NEVER add transitions that slow down perceived interaction
- NEVER hide important information behind hover states on mobile
- NEVER use low-contrast text for important information
- NEVER center-align body text (left-align for readability)
- NEVER use placeholder text as the only label

---

## Design Cohesion

### Before Adding Anything New

```
┌─────────────────────────────────────────────┐
│ Does this exact pattern exist?              │
│    YES → Use it                             │
│    NO  ↓                                    │
├─────────────────────────────────────────────┤
│ Does a similar pattern exist?               │
│    YES → Adapt it minimally                 │
│    NO  ↓                                    │
├─────────────────────────────────────────────┤
│ Is a new pattern explicitly required?       │
│    YES → Document why, follow design system │
│    NO  → Simplify the requirement           │
└─────────────────────────────────────────────┘
```

### Color Usage
- MUST use only colors defined in `app/app.css` theme
- MUST use semantic color variables (--primary, --muted, etc.) not raw values
- SHOULD limit accent color to one per view (typically --primary)
- NEVER introduce new color values without updating the design system

### Spacing & Layout
- MUST use Tailwind's default spacing scale (4, 8, 12, 16, 20, 24, 32, etc.)
- MUST use existing border-radius values (--radius-sm, --radius-md, --radius-lg)
- SHOULD use consistent spacing within component groups
- NEVER use arbitrary spacing values (`mt-[13px]`)

### Component Reuse
- MUST check `app/components/ui/` before creating new components
- MUST check `app/app.css` for existing utility classes (kawaii-*)
- SHOULD extend existing components rather than create new ones
- NEVER duplicate styling logic across components

---

## Interaction Design

### States
Every interactive element MUST have clearly distinguishable states:
- **Default** - Normal appearance
- **Hover** - Subtle highlight (desktop only)
- **Active/Pressed** - Provides feedback during click
- **Focused** - Visible focus ring for keyboard navigation
- **Disabled** - Clearly reduced affordance
- **Selected** (if applicable) - Distinct from hover

### Feedback Timing
| Action Type | Response Time | Feedback Type |
|-------------|---------------|---------------|
| Click/tap | < 100ms | Visual state change |
| Form submission | < 300ms or loading indicator | Progress or success state |
| Navigation | < 100ms | Immediate transition start |
| Error | Immediate | Error message near action |

### Error Handling
- MUST show errors next to the element that caused them
- MUST use clear, actionable language ("Email is required" not "Invalid input")
- MUST preserve user input when showing errors
- SHOULD provide a clear path to fix the error
- NEVER use red alone to indicate errors (add icon or text for accessibility)

### Touch & Mobile
- MUST have minimum 44x44px touch targets
- MUST respect safe-area-inset for fixed elements
- MUST not rely on hover states for essential functionality
- SHOULD consider thumb reach zones for primary actions

---

## Stack

- MUST use Tailwind CSS defaults unless custom values already exist or are explicitly requested
- MUST use `motion/react` (formerly `framer-motion`) when JavaScript animation is required
- SHOULD use `tw-animate-css` for entrance and micro-animations in Tailwind CSS
- MUST use `cn` utility (`clsx` + `tailwind-merge`) for class logic

## Components

- MUST use accessible component primitives for anything with keyboard or focus behavior (`Base UI`, `React Aria`, `Radix`)
- MUST use the project's existing component primitives first
- NEVER mix primitive systems within the same interaction surface
- SHOULD prefer [`Base UI`](https://base-ui.com/react/components) for new primitives if compatible with the stack
- MUST add an `aria-label` to icon-only buttons
- NEVER rebuild keyboard or focus behavior by hand unless explicitly requested

## Interaction

- MUST use an `AlertDialog` for destructive or irreversible actions
- SHOULD use structural skeletons for loading states
- NEVER use `h-screen`, use `h-dvh`
- MUST respect `safe-area-inset` for fixed elements
- MUST show errors next to where the action happens
- NEVER block paste in `input` or `textarea` elements

## Animation

- NEVER add animation unless it is explicitly requested
- MUST animate only compositor props (`transform`, `opacity`)
- NEVER animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`)
- SHOULD avoid animating paint properties (`background`, `color`) except for small, local UI (text, icons)
- SHOULD use `ease-out` on entrance
- NEVER exceed `200ms` for interaction feedback
- MUST pause looping animations when off-screen
- SHOULD respect `prefers-reduced-motion`
- NEVER introduce custom easing curves unless explicitly requested
- SHOULD avoid animating large images or full-screen surfaces

## Typography

- MUST use `text-balance` for headings and `text-pretty` for body/paragraphs
- MUST use `tabular-nums` for data
- SHOULD use `truncate` or `line-clamp` for dense UI
- NEVER modify `letter-spacing` (`tracking-*`) unless explicitly requested

## Layout

- MUST use a fixed `z-index` scale (no arbitrary `z-*`)
- SHOULD use `size-*` for square elements instead of `w-*` + `h-*`

## Performance

- NEVER animate large `blur()` or `backdrop-filter` surfaces
- NEVER apply `will-change` outside an active animation
- NEVER use `useEffect` for anything that can be expressed as render logic

## Design

- NEVER use gradients unless explicitly requested
- NEVER use purple or multicolor gradients
- NEVER use glow effects as primary affordances
- SHOULD use Tailwind CSS default shadow scale unless explicitly requested
- MUST give empty states one clear next action
- SHOULD limit accent color usage to one per view
- SHOULD use existing theme or Tailwind CSS color tokens before introducing new ones

---

## Self-Review Checklist

Before submitting UI changes, verify:

### Consistency
- [ ] All colors come from the existing design system
- [ ] All spacing uses standard Tailwind values
- [ ] Border radius matches existing components
- [ ] Typography follows existing patterns

### UX
- [ ] Clear visual hierarchy (primary action is obvious)
- [ ] All interactive elements have hover/active/focus states
- [ ] Loading and error states are handled
- [ ] Touch targets are at least 44x44px

### AI Pitfall Check
- [ ] No gradients (unless existing or requested)
- [ ] No glow/shimmer effects
- [ ] No decorative-only elements added
- [ ] No "improvements" beyond what was requested
- [ ] Matches the existing aesthetic (not a different style)

### Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus states are visible
- [ ] Icon-only buttons have aria-label
- [ ] Form inputs have associated labels
