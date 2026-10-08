export type NavItemId = 'home' | 'featured' | 'guide' | 'focus' | 'lighting';

export type NavAction = 'home' | 'featured' | 'guide' | 'focus' | 'lighting';

export interface NavItem {
  id: NavItemId;
  label: string;
  sub?: string;
  icon: string;
  action: NavAction;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'house', action: 'home' },
  {
    id: 'featured',
    label: 'Featured',
    sub: '2 interactive',
    icon: 'star',
    action: 'featured',
  },
  {
    id: 'guide',
    label: 'Explorer guide',
    sub: 'Controls & shortcuts',
    icon: 'hand',
    action: 'guide',
  },
  {
    id: 'focus',
    label: 'Focus view',
    sub: 'Hide chrome',
    icon: 'expand',
    action: 'focus',
  },
  {
    id: 'lighting',
    label: 'Scene lighting',
    sub: 'Day or dusk',
    icon: 'sun',
    action: 'lighting',
  },
];

export function navItemById(id: NavItemId): NavItem {
  return NAV_ITEMS.find((n) => n.id === id)!;
}
