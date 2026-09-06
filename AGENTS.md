# E-commerce Frontend – Agent Guide

## Project overview

This is a Next.js App Router e-commerce frontend written in TypeScript. The application uses Tailwind CSS for styling and organizes business code by feature/domain.

## Commands

Run these from the repository root:

```bash
npm run dev        # Start the local development server
npm run typecheck  # Validate TypeScript without emitting files
npm run lint       # Run ESLint
npm run build      # Create and validate a production build
```

Before handing off a non-trivial change, run `npm run typecheck` and the most relevant verification command. Run `npm run build` when changing routing, Next configuration, providers, or build tooling.

## Directory conventions

- `src/app/`: App Router routes, layouts, loading/error states, and page-specific metadata.
- `src/components/`: Reusable, domain-independent UI components. Put app-wide providers in `src/components/providers.tsx`.
- `src/features/<feature>/`: Domain code, such as cart, auth, products, checkout, and orders. Keep feature components, schemas, hooks, API functions, and stores close together.
- `src/lib/`: Framework-agnostic shared utilities and integrations, including `lib/api/client.ts`.
- `src/types/`: Shared TypeScript types used by more than one feature.

Use the `@/` import alias for code under `src`.

## Implementation rules

- Prefer Server Components. Add `"use client"` only for browser APIs, hooks, event handlers, client-side state, or interactive UI.
- Keep page files focused on composition. Move reusable or domain logic into `components` or `features`.
- Use React Query for remote client-side data fetching/caching; do not duplicate API response state in Zustand.
- Use Zustand only for lightweight cross-page client state, such as the cart or UI preferences.
- Use `react-hook-form`, `zod`, and `@hookform/resolvers` for user-input forms. Infer form types from Zod schemas.
- Call backend services through `src/lib/api/client.ts` or feature-specific API modules built on it. Do not scatter raw `fetch`/Axios configuration across components.
- Read public runtime configuration from `NEXT_PUBLIC_*` variables only. Never expose secrets in client-side code.
- Use `cn()` from `@/lib/utils` to compose conditional Tailwind classes.
- Use semantic HTML, keyboard-accessible controls, descriptive labels, and `next/image` / `next/link` where appropriate.

## Styling

- Use Tailwind utility classes. Keep global CSS limited to tokens, resets, and truly global styling in `src/app/globals.css`.
- Follow the existing neutral visual baseline unless a design system is introduced.
- Make layouts responsive by default; verify small and large viewport behavior for user-facing screens.

## Scope and safety

- Do not modify generated files or dependency lockfiles manually.
- Do not commit `.env.local`, credentials, API keys, or other secrets. Update `.env.example` when adding a required public environment variable.
- Preserve unrelated working-tree changes.
- Add dependencies only when the value is clear; reuse the existing stack first.
