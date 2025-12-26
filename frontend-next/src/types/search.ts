export type FilterOption = {
    id: string;
    label: string;
    icon?: React.ReactNode;
};

export type FilterGroup = {
    id: string;
    label: string;
    options: FilterOption[];
    type: 'SINGLE' | 'MULTI';
};

export type SearchNexusState = {
    query: string;
    activeFilters: Record<string, string[]>;
    activeTab: 'PUBLIC' | 'PERSONAL' | 'ALL';
};

export interface SearchNexusProps {
    placeholder?: string;
    groups: FilterGroup[];
    state: SearchNexusState;
    onChange: (state: SearchNexusState) => void;
    onPersonalTabAttempt: () => void;
    isLoggedIn: boolean;
    className?: string;
    variant?: 'default' | 'minimal';
    showSwitches?: boolean;
    showFilters?: boolean;
}
