// Extensible view system types
export type ViewType = 'calendar' | 'staff' | 'section';

export interface ViewConfig {
  id: ViewType;
  label: string;
  icon: string;
}

export const VIEW_CONFIGS: ViewConfig[] = [
  { id: 'calendar', label: 'Calendar View', icon: 'calendar' },
  { id: 'staff', label: 'Staff View', icon: 'people' },
  { id: 'section', label: 'Section View', icon: 'section' },
];
