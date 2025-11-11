// Component prop types

export interface NavbarProps {
  toggleSidebar: () => void;
  toggleMinimize: () => void;
  isMinimized: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
  isMinimized: boolean;
}

export interface MenuItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export interface SubmenuItemProps {
  to: string;
  label: string;
}

export interface CollapsibleMenuProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
  submenuItems: Array<{ label: string; to: string }>;
}
