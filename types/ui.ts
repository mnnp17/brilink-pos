export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  badgeText?: string;
  disabled?: boolean;
}

export interface DropdownGroup {
  groupLabel: string;
  options: DropdownOption[];
}

export interface GroupedSelectProps {
  id: string;
  name?: string;
  label?: string;
  placeholder?: string;
  groups: DropdownGroup[];
  value?: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  isError?: boolean;
  errorMessage?: string;
}
