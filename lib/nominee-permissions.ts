/**
 * Nominee Permission Matrix
 * Defines what access level a nominee has for each module.
 * 
 * view   = can see the module and its data but cannot edit
 * edit   = can see AND modify data in the module
 * hidden = module is not visible to the nominee at all
 */

export type PermissionLevel = 'view' | 'edit' | 'hidden';

export interface ModulePermission {
    module: string;
    level: PermissionLevel;
    description: string;
}

export const NOMINEE_PERMISSIONS: ModulePermission[] = [
    { module: 'dashboard', level: 'view', description: 'View portfolio overview' },
    { module: 'insurance', level: 'view', description: 'View insurance policies' },
    { module: 'banking', level: 'view', description: 'View bank accounts (no edit)' },
    { module: 'assets', level: 'view', description: 'View property and vehicle records' },
    { module: 'holdings', level: 'view', description: 'View stock and investment holdings' },
    { module: 'liabilities', level: 'edit', description: 'View and edit loan/liability records' },
    { module: 'receivables', level: 'edit', description: 'View and edit receivable records' },
    { module: 'belongings', level: 'edit', description: 'View and edit belonging records' },
    { module: 'documents', level: 'view', description: 'View and download documents (no delete)' },
    { module: 'nominees', level: 'hidden', description: 'Not visible to nominees' },
    { module: 'settings', level: 'hidden', description: 'Not visible to nominees' },
    { module: 'family', level: 'hidden', description: 'Not visible to nominees' },
];

/**
 * Get permission level for a specific module
 */
export function getModulePermission(moduleName: string): PermissionLevel {
    const perm = NOMINEE_PERMISSIONS.find(p => p.module === moduleName);
    return perm?.level ?? 'hidden'; // Default to hidden if not found
}

/**
 * Check if nominee can view a module
 */
export function canNomineeView(moduleName: string): boolean {
    const level = getModulePermission(moduleName);
    return level === 'view' || level === 'edit';
}

/**
 * Check if nominee can edit a module
 */
export function canNomineeEdit(moduleName: string): boolean {
    return getModulePermission(moduleName) === 'edit';
}

/**
 * Check if a module is hidden from a nominee
 */
export function isNomineeHidden(moduleName: string): boolean {
    return getModulePermission(moduleName) === 'hidden';
}

/**
 * Get all visible modules for nominee (for sidebar filtering)
 */
export function getNomineeVisibleModules(): string[] {
    return NOMINEE_PERMISSIONS
        .filter(p => p.level !== 'hidden')
        .map(p => p.module);
}

/**
 * Get all editable modules for nominee
 */
export function getNomineeEditableModules(): string[] {
    return NOMINEE_PERMISSIONS
        .filter(p => p.level === 'edit')
        .map(p => p.module);
}
