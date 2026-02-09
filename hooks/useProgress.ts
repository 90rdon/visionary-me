import { useState, useEffect, useCallback } from 'react';
import { TaskItem } from '../types';

interface DailyProgress {
  date: string; // YYYY-MM-DD
  completed: number;
}

interface ProgressStats {
  streak: number;
  todayCompleted: number;
  weekCompleted: number;
  totalCompleted: number;
}

const STORAGE_KEY = 'visionary-progress-v1';

const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

const getDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getDateString(date);
};

export const useProgress = () => {
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    streak: 0,
    todayCompleted: 0,
    weekCompleted: 0,
    totalCompleted: 0,
  });

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDailyProgress(parsed);
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (dailyProgress.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyProgress));
    }
  }, [dailyProgress]);

  // Calculate stats whenever dailyProgress changes
  useEffect(() => {
    const today = getDateString();
    const todayEntry = dailyProgress.find(d => d.date === today);
    const todayCompleted = todayEntry?.completed || 0;

    // Calculate streak
    let streak = 0;
    let checkDate = new Date();

    // If nothing completed today, check if yesterday was completed
    if (!todayEntry || todayEntry.completed === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = getDateString(checkDate);
      const entry = dailyProgress.find(d => d.date === dateStr);
      if (entry && entry.completed > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate week total
    let weekCompleted = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = getDaysAgo(i);
      const entry = dailyProgress.find(d => d.date === dateStr);
      if (entry) {
        weekCompleted += entry.completed;
      }
    }

    // Calculate total
    const totalCompleted = dailyProgress.reduce((sum, d) => sum + d.completed, 0);

    setStats({
      streak,
      todayCompleted,
      weekCompleted,
      totalCompleted,
    });
    console.log('Stats updated:', { streak, todayCompleted, weekCompleted, totalCompleted });
  }, [dailyProgress]);

  // Record a task completion
  const recordCompletion = useCallback(() => {
    const today = getDateString();
    setDailyProgress(prev => {
      console.log('Previous daily progress:', prev);
      const existing = prev.find(d => d.date === today);
      if (existing) {
        const updated = prev.map(d =>
          d.date === today ? { ...d, completed: d.completed + 1 } : d
        );
        console.log('Updated daily progress (increment):', updated);
        return updated;
      } else {
        const updated = [...prev, { date: today, completed: 1 }];
        console.log('Updated daily progress (new day):', updated);
        return updated;
      }
    });
  }, []);

  return {
    stats,
    recordCompletion,
  };
};

// Helper to calculate completion percentage of a task tree
export const getCompletionPercentage = (task: TaskItem): number => {
  if (task.subTasks.length === 0) {
    return task.completed ? 100 : 0;
  }

  const totalSubtasks = task.subTasks.length;
  const completedSubtasks = task.subTasks.filter(s => s.completed).length;

  // Weight: parent completion + average of subtask completion
  const subtaskAvg = task.subTasks.reduce((sum, s) => sum + getCompletionPercentage(s), 0) / totalSubtasks;

  return Math.round(subtaskAvg);
};

export default useProgress;
