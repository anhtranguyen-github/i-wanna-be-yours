# Project Conventions & Rules

Based on an analysis of the existing codebase, the following conventions should be followed for future development.

## 1. Technology Stack
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react` (preferred) or `@heroicons/react`
- **State Management**: React Context (`src/context`) + Local State (`useState`)

## 2. File Structure
- **Pages**: `src/app/[route]/page.tsx`
- **Components**: `src/components/[ComponentName].tsx`
- **Contexts**: `src/context/[ContextName].tsx`
- **Services**: `src/services/[ServiceName].ts`
- **Assets**: `public/`

## 3. Naming Conventions
- **Files**: PascalCase for components (e.g., `Sidebar.tsx`), camelCase for utilities/hooks (e.g., `useUser.tsx`).
- **Components**: PascalCase (e.g., `function Sidebar() {}`).
- **Interfaces/Types**: PascalCase (e.g., `interface UserProps`).
- **Variables/Functions**: camelCase.

## 4. Component Patterns
- **Definition**: Use `export default function ComponentName() {}`.
- **Client Components**: Add `"use client";` at the very top if using hooks or interactivity.
- **Props**: Define interfaces/types within the component file (unless shared globally).
- **Imports**: Use absolute imports with `@/` alias (e.g., `import Nav from "@/components/Nav";`).

## 5. Styling Rules
- Use **Tailwind CSS** utility classes directly in `className`.
- Avoid inline styles (`style={{}}`) unless dynamic values are required.
- Support Dark Mode using `dark:` prefix (e.g., `bg-white dark:bg-gray-800`).

## 6. Data Fetching & State
- **API Calls**: Encapsulate API logic in service files (e.g., `aiTutorService.tsx`) rather than raw `fetch` in components.
- **Global State**: Use `UserContext` for auth state.
- **Local Persistence**: Use `localStorage` for client-side only persistence when backend endpoints are unavailable.

## 7. Best Practices
- **Images**: Use `next/image` for optimized image loading.
- **Links**: Use `next/link` for internal navigation.
- **Metadata**: Define metadata in `layout.tsx` or `page.tsx` (App Router style), avoid `next/head` if possible.
