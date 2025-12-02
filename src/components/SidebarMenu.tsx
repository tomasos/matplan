import { ShoppingCart, Plus, Settings } from 'lucide-react';
import './SidebarMenu.css';

type MenuItem = 'shopping' | 'add-meal' | 'settings' | null;

interface SidebarMenuProps {
  activeView: MenuItem;
  onMenuItemClick: (item: MenuItem) => void;
}

export function SidebarMenu({ activeView, onMenuItemClick }: SidebarMenuProps) {
  const handleClick = (item: MenuItem) => {
    // Toggle: if clicking the same item, close it
    if (activeView === item) {
      onMenuItemClick(null);
    } else {
      onMenuItemClick(item);
    }
  };

  return (
    <nav className="sidebar-menu">
      <button
        onClick={() => handleClick('shopping')}
        className={`sidebar-menu-item ${activeView === 'shopping' ? 'active' : ''}`}
        aria-label="Shopping list"
      >
        <ShoppingCart size={24} />
      </button>
      <button
        onClick={() => handleClick('add-meal')}
        className={`sidebar-menu-item ${activeView === 'add-meal' ? 'active' : ''}`}
        aria-label="Add meal"
      >
        <Plus size={24} />
      </button>
      <button
        onClick={() => handleClick('settings')}
        className={`sidebar-menu-item ${activeView === 'settings' ? 'active' : ''}`}
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>
    </nav>
  );
}

