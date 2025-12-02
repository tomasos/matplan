import { useState, useMemo } from 'react';
import { getWeekNumber, getWeekInfo, getDayKey } from '../utils/weekUtils';
import { WeekInfo } from '../types';
import { useWeekPlan } from '../contexts/WeekPlanContext';

export function useWeekNavigation() {
  const [currentYear, setCurrentYear] = useState(() => getWeekNumber(new Date()).year);
  const [currentWeek, setCurrentWeek] = useState(() => getWeekNumber(new Date()).week);
  const { weekPlans } = useWeekPlan();

  // Create a serialized key for the current week's plans to ensure proper dependency tracking
  const weekPlansKey = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    return days.map((day) => {
      const dayKey = getDayKey(currentYear, currentWeek, day);
      return `${dayKey}:${weekPlans[dayKey] || 'null'}`;
    }).join('|');
  }, [currentYear, currentWeek, weekPlans]);

  const weekInfo: WeekInfo = useMemo(
    () => getWeekInfo(currentYear, currentWeek, weekPlans),
    [currentYear, currentWeek, weekPlansKey, weekPlans]
  );

  const goToPreviousWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    } else {
      setCurrentYear(currentYear - 1);
      setCurrentWeek(52);
    }
  };

  const goToNextWeek = () => {
    if (currentWeek < 52) {
      setCurrentWeek(currentWeek + 1);
    } else {
      setCurrentYear(currentYear + 1);
      setCurrentWeek(1);
    }
  };

  const goToCurrentWeek = () => {
    const { year, week } = getWeekNumber(new Date());
    setCurrentYear(year);
    setCurrentWeek(week);
  };

  return {
    year: currentYear,
    week: currentWeek,
    weekInfo,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}

