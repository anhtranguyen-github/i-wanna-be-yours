import {
    MessageCircle,
    Wrench,
    Gamepad2,
    Library,
    BookOpen,
    CalendarDays,
    GraduationCap,
    Settings,
    User,
    LucideIcon
} from 'lucide-react';

export interface NavSection {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    /**
     * Paths that should trigger this section to be active.
     * Can be a prefix (string) or a Regular Expression.
     */
    matchPaths: (string | RegExp)[];
}

export const NAV_CONFIG: NavSection[] = [
    {
        id: 'chat',
        label: 'Chat',
        href: '/chat',
        icon: MessageCircle,
        matchPaths: ['/chat'],
    },
    {
        id: 'tools',
        label: 'Tools',
        href: '/tools',
        icon: Wrench,
        matchPaths: ['/tools', '/vocabulary-map'],
    },
    {
        id: 'game',
        label: 'Game',
        href: '/game',
        icon: Gamepad2,
        matchPaths: ['/game', '/flashcards'],
    },
    {
        id: 'library',
        label: 'Library',
        href: '/library',
        icon: Library,
        matchPaths: ['/library', '/downloads', '/knowledge-base'],
    },
    {
        id: 'dictionary',
        label: 'Dictionary',
        href: '/dictionary',
        icon: BookOpen,
        matchPaths: ['/dictionary', '/grammarpoint'],
    },
    {
        id: 'study-plan',
        label: 'Study Plan',
        href: '/study-plan',
        icon: CalendarDays,
        matchPaths: ['/study-plan'],
    },
    {
        id: 'practice',
        label: 'Practice',
        href: '/practice',
        icon: GraduationCap,
        matchPaths: [
            '/practice',
            '/jlpt',
            '/quiz',
            '/kanji-dashboard',
            // Example of explicit child routes that might not share the prefix
            // Add more as discovered in the codebase
            /^\/exam\//,
            /^\/results\//
        ],
    },
];

export const UTILITY_CONFIG: NavSection[] = [
    {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        matchPaths: ['/settings'],
    },
    {
        id: 'profile',
        label: 'Profile',
        href: '/dashboard',
        icon: User,
        matchPaths: ['/dashboard'],
    },
];

/**
 * Resolves the active section ID based on the current pathname.
 * This is the single source of truth for sidebar state.
 * 
 * Why simple prefix matching is insufficient:
 * 1. Conceptual Hierarchy: Some routes (/jlpt) belong to a section (/practice) 
 *    but don't share its URL prefix.
 * 2. Flat Routes: Complex applications often have flat URL structures that 
 *    don't reflect logical groupings.
 */
export function resolveActiveSectionId(pathname: string | null): string | null {
    if (!pathname) return null;

    // Check main navigation sections
    for (const section of NAV_CONFIG) {
        for (const pattern of section.matchPaths) {
            if (typeof pattern === 'string') {
                if (pathname.startsWith(pattern)) return section.id;
            } else {
                if (pattern.test(pathname)) return section.id;
            }
        }
    }

    // Check utility sections (Settings, Profile)
    for (const section of UTILITY_CONFIG) {
        for (const pattern of section.matchPaths) {
            if (typeof pattern === 'string') {
                if (pathname.startsWith(pattern)) return section.id;
            } else {
                if (pattern.test(pathname)) return section.id;
            }
        }
    }

    return null;
}
