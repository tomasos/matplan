import { MoveLeft, MoveRight } from 'lucide-react';
import './WeekSelector.css';

interface WeekSelectorProps {
  week: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function WeekSelector({ week, onPrevious, onNext }: WeekSelectorProps) {
  return (
    <div className="week-selector">
      <button onClick={onPrevious} className="week-nav-button" aria-label="Previous week">
        <MoveLeft size={24} />
      </button>
      <span className="week-number font-display-bold-32">{week}</span>
      <button onClick={onNext} className="week-nav-button" aria-label="Next week">
        <MoveRight size={24} />
      </button>
    </div>
  );
}

