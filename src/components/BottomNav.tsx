import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, ShoppingCart, List, Plus, Settings } from 'lucide-react';
import './BottomNav.css';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <button
        onClick={() => navigate('/')}
        className={`nav-icon ${isActive('/') ? 'active' : ''}`}
        aria-label="Week planner"
      >
        <Calendar size={24} />
      </button>
      <button
        onClick={() => navigate('/shopping')}
        className={`nav-icon ${isActive('/shopping') ? 'active' : ''}`}
        aria-label="Shopping list"
      >
        <ShoppingCart size={24} />
      </button>
      <button
        onClick={() => navigate('/meals')}
        className={`nav-icon ${isActive('/meals') ? 'active' : ''}`}
        aria-label="Meal list"
      >
        <List size={24} />
      </button>
      <button
        onClick={() => navigate('/add-meal')}
        className={`nav-icon ${isActive('/add-meal') ? 'active' : ''}`}
        aria-label="Add meal"
      >
        <Plus size={24} />
      </button>
      <button
        onClick={() => navigate('/settings')}
        className={`nav-icon ${isActive('/settings') ? 'active' : ''}`}
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>
    </nav>
  );
}

