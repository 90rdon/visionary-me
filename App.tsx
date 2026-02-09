
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Mic, MicOff, Brain, Check, Trash2, ChevronDown,
  ChevronRight, Loader2, Maximize2, Minimize2, ChevronLeft,
  X, Sparkles, AlertCircle, RefreshCw, ShieldAlert, Cpu, CloudLightning,
  Download, Undo2, Redo2, Rocket, Plane, BookOpen
} from 'lucide-react';
import { TaskItem, VisualizerMode, VoiceStatus, AiProvider } from './types';
import { breakDownTask, LiveSessionManager } from './services/geminiService';
import Orb from './components/Orb';
import Confetti from './components/Confetti';
import { useProgress, getCompletionPercentage } from './hooks/useProgress';

// --- Utility Functions for Tree Management ---

const findInTree = (items: TaskItem[], id: string): TaskItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findInTree(item.subTasks, id);
    if (found) return found;
  }
  return null;
};

const findByKeyword = (items: TaskItem[], keyword: string): TaskItem | null => {
  const kw = keyword.toLowerCase();
  for (const item of items) {
    if (item.title.toLowerCase().includes(kw)) return item;
    const found = findByKeyword(item.subTasks, keyword);
    if (found) return found;
  }
  return null;
};

const updateInTree = (items: TaskItem[], id: string, updater: (item: TaskItem) => TaskItem): TaskItem[] => {
  return items.map(item => {
    if (item.id === id) return updater(item);
    return { ...item, subTasks: updateInTree(item.subTasks, id, updater) };
  });
};

const removeFromTree = (items: TaskItem[], id: string): TaskItem[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => ({ ...item, subTasks: removeFromTree(item.subTasks, id) }));
};

const getPathToItem = (items: TaskItem[], id: string, path: TaskItem[] = []): TaskItem[] | null => {
  for (const item of items) {
    const currentPath = [...path, item];
    if (item.id === id) return currentPath;
    const foundPath = getPathToItem(item.subTasks, id, currentPath);
    if (foundPath) return foundPath;
  }
  return null;
};

const areAllSubtasksComplete = (item: TaskItem): boolean => {
  if (item.subTasks.length === 0) return true;
  return item.subTasks.every(sub => sub.completed && areAllSubtasksComplete(sub));
};

const isParentWithSubtasks = (item: TaskItem): boolean => {
  return item.subTasks.length > 0;
};

// --- Template Data ---

const TASK_TEMPLATES = [
  {
    id: 'product',
    title: 'Launch a Product',
    icon: Rocket,
    color: 'from-orange-500 to-red-500',
    tasks: [
      { title: 'Define MVP scope', subTasks: ['List core features', 'Identify must-haves vs nice-to-haves', 'Set success criteria'] },
      { title: 'Build prototype', subTasks: ['Create wireframes', 'Develop core functionality', 'Internal testing'] },
      { title: 'Prepare for launch', subTasks: ['Set up landing page', 'Prepare marketing assets', 'Plan launch day activities'] },
      { title: 'Launch & iterate', subTasks: ['Announce on social media', 'Collect user feedback', 'Prioritize improvements'] },
    ]
  },
  {
    id: 'trip',
    title: 'Plan a Trip',
    icon: Plane,
    color: 'from-cyan-500 to-blue-500',
    tasks: [
      { title: 'Choose destination', subTasks: ['Research potential places', 'Check visa requirements', 'Compare costs'] },
      { title: 'Book essentials', subTasks: ['Book flights', 'Reserve accommodation', 'Arrange transportation'] },
      { title: 'Plan activities', subTasks: ['List must-see attractions', 'Make restaurant reservations', 'Schedule free time'] },
      { title: 'Prepare for departure', subTasks: ['Pack bags', 'Confirm all bookings', 'Set out-of-office'] },
    ]
  },
  {
    id: 'book',
    title: 'Write a Book',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    tasks: [
      { title: 'Outline the book', subTasks: ['Define the core message', 'Create chapter structure', 'Research key topics'] },
      { title: 'Write first draft', subTasks: ['Set daily word count goal', 'Complete each chapter', 'Don\'t edit while writing'] },
      { title: 'Edit & refine', subTasks: ['Self-edit for clarity', 'Get beta reader feedback', 'Revise based on feedback'] },
      { title: 'Publish', subTasks: ['Choose publishing method', 'Design cover', 'Set up distribution'] },
    ]
  }
];

// --- Sub-components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, onTouchStart, onTouchEnd, onTouchCancel, ...rest }: any) => {
  const base = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation";
  const variants = {
    primary: "bg-nebula-600 hover:bg-nebula-500 text-white shadow-lg shadow-nebula-900/40",
    secondary: "bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border border-slate-700/50 backdrop-blur-md",
    danger: "text-red-400 hover:bg-red-500/10",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
    voice: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
  };
  return (
    <button onClick={onClick} disabled={disabled} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel} className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...rest}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

interface TaskNodeProps {
  item: TaskItem;
  depth: number;
  editingId: string | null;
  editValue: string;
  focusedId: string | null;
  setEditValue: (val: string) => void;
  saveEdit: () => void;
  startEditing: (item: TaskItem) => void;
  toggleComplete: (id: string) => void;
  setFocusedId: (id: string | null) => void;
  handleBreakdownNode: (id: string) => void;
  deleteItem: (id: string) => void;
  addItem: (title: string, parentId?: string) => TaskItem;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  isAiDisabled: boolean;
  activeProvider: AiProvider | null;
}

const TaskNode: React.FC<TaskNodeProps> = ({
  item, depth, editingId, editValue, focusedId, setEditValue, saveEdit,
  startEditing, toggleComplete, setFocusedId, handleBreakdownNode, deleteItem, addItem, setTasks, isAiDisabled, activeProvider
}) => {
  const isEditing = editingId === item.id;
  const isFocused = focusedId === item.id;
  const hasChildren = item.subTasks.length > 0;

  return (
    <div className={`mt-3 ${depth > 0 ? 'ml-4 md:ml-6 border-l border-slate-700/50 pl-4' : ''}`}>
      <div
        className={`group flex items-start gap-3 p-4 glass-panel rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-nebula-500/50 shadow-2xl shadow-nebula-500/10' : 'hover:border-slate-500/40 shadow-lg'}`}
        onDoubleClick={(e) => { e.stopPropagation(); startEditing(item); }}
        onClick={(e) => {
          if (e.detail === 1) {
            setTasks(prev => updateInTree(prev, item.id, it => ({ ...it, isExpanded: !it.isExpanded })));
          }
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleComplete(item.id); }}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.completed ? 'bg-nebula-500 border-nebula-500 text-white shadow-nebula-500/50' : 'border-slate-600 hover:border-nebula-400'}`}
        >
          {item.completed && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                autoFocus
                className="bg-slate-900/80 text-slate-100 border border-nebula-500 rounded-lg px-2 py-0.5 outline-none w-full"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className={`text-base md:text-lg font-medium transition-all truncate ${item.completed ? 'line-through text-slate-500 italic' : 'text-slate-100'}`}>
                {item.title}
              </span>
            )}
            {hasChildren && (
              <div className="text-slate-500">
                {item.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            )}
          </div>
          {hasChildren && (
            <div className="flex items-center gap-2 mt-1">
              {/* Completion percentage bar */}
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-nebula-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${getCompletionPercentage(item)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{getCompletionPercentage(item)}%</span>
              </div>
              {!item.isExpanded && (
                <span className="text-[10px] text-nebula-400 font-medium uppercase tracking-tighter opacity-80">
                  {item.subTasks.length} steps
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setFocusedId(isFocused ? null : item.id); }}
            className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${isFocused ? 'text-nebula-400' : 'text-slate-500 hover:text-nebula-300'}`}
            title={isFocused ? "Broaden View" : "Focus on this objective"}
          >
            {isFocused ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          {!isAiDisabled && (
            <button
              onClick={(e) => { e.stopPropagation(); handleBreakdownNode(item.id); }}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-nebula-400 transition-colors"
              title="Reveal Path"
            >
              <Brain size={18} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {item.isExpanded && (
        <div className="animate-fade-in">
          {!item.completed && (
            <div className="mt-3 ml-4 md:ml-6 pl-4 flex items-center gap-3 group/add">
              <Plus size={10} className="text-slate-700" />
              <input
                placeholder="Add to the vision..."
                className="bg-transparent text-sm text-slate-400 focus:text-slate-200 outline-none w-full placeholder:text-slate-700"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    addItem(e.currentTarget.value.trim(), item.id);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          )}

          {item.isBreakingDown ? (
            <div className="flex items-center gap-3 py-4 px-8 text-xs text-nebula-300 font-medium">
              <Loader2 size={14} className="animate-spin text-nebula-500" />
              <span>
                {activeProvider === 'LOCAL_NANO' ? "Neural Core (Local) Processing..." : "Aligning Path via Cloud..."}
              </span>
            </div>
          ) : (
            item.subTasks.map(sub => (
              <TaskNode
                key={sub.id}
                item={sub}
                depth={depth + 1}
                editingId={editingId}
                editValue={editValue}
                focusedId={focusedId}
                setEditValue={setEditValue}
                saveEdit={saveEdit}
                startEditing={startEditing}
                toggleComplete={toggleComplete}
                setFocusedId={setFocusedId}
                handleBreakdownNode={handleBreakdownNode}
                deleteItem={deleteItem}
                addItem={addItem}
                setTasks={setTasks}
                isAiDisabled={isAiDisabled}
                activeProvider={activeProvider}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VisualizerMode>(VisualizerMode.IDLE);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(VoiceStatus.IDLE);
  const [audioVolume, setAudioVolume] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [transcript, setTranscript] = useState<string>('');
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [voiceSessionTaskCount, setVoiceSessionTaskCount] = useState(0);
  const [isVoiceEnding, setIsVoiceEnding] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchDeviceRef = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const { stats: progressStats, recordCompletion } = useProgress();
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'info' | 'success', action?: { label: string, onClick: () => void } } | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<TaskItem[][]>([]);
  const [redoStack, setRedoStack] = useState<TaskItem[][]>([]);
  const MAX_UNDO_STACK = 20;

  // Track which AI is doing the work
  const [lastUsedProvider, setLastUsedProvider] = useState<AiProvider | null>(null);
  const [isModelDownloading, setIsModelDownloading] = useState(false);

  const tasksRef = useRef<TaskItem[]>([]);
  const liveSessionRef = useRef<LiveSessionManager | null>(null);

  // Safety check for API Key to prevent white-screen crashes
  const isAiDisabled = useMemo(() => {
    const key = process.env.API_KEY;
    return !key || key === "undefined" || key.trim() === "";
  }, []);

  const focusedItem = useMemo(() => focusedId ? findInTree(tasks, focusedId) : null, [tasks, focusedId]);
  const breadcrumbs = useMemo(() => focusedId ? getPathToItem(tasks, focusedId) : null, [tasks, focusedId]);
  const displayItems = useMemo(() => focusedId ? (focusedItem?.subTasks || []) : tasks, [tasks, focusedId, focusedItem]);

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  useEffect(() => {
    const saved = localStorage.getItem('visionary-tasks-v1');
    if (saved) {
      try { setTasks(JSON.parse(saved)); }
      catch (e) { console.error("Failed to load saved tasks:", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('visionary-tasks-v1', JSON.stringify(tasks));
  }, [tasks]);

  const showToast = useCallback((message: string, type: 'error' | 'info' | 'success' = 'info', action?: { label: string, onClick: () => void }) => {
    setToast({ message, type, action });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Undo/Redo functions
  const pushUndo = useCallback((currentTasks: TaskItem[]) => {
    setUndoStack(prev => [...prev.slice(-(MAX_UNDO_STACK - 1)), currentTasks]);
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, tasks]);
    setTasks(previous);
    showToast("Undone", "info");
  }, [undoStack, tasks, showToast]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, tasks]);
    setTasks(next);
    showToast("Redone", "info");
  }, [redoStack, tasks, showToast]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Export tasks to JSON
  const exportTasks = useCallback(() => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionary-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Tasks exported", "success");
  }, [tasks, showToast]);

  const addItem = useCallback((title: string, parentId?: string) => {
    const newItem: TaskItem = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      isBreakingDown: false,
      isExpanded: true,
      subTasks: [],
      createdAt: Date.now()
    };
    setTasks(prev => {
      pushUndo(prev);
      if (parentId) {
        return updateInTree(prev, parentId, item => ({
          ...item, subTasks: [...item.subTasks, newItem], isExpanded: true
        }));
      } else {
        return [newItem, ...prev];
      }
    });
    return newItem;
  }, [pushUndo]);

  const toggleComplete = useCallback((id: string) => {
    const currentItem = findInTree(tasksRef.current, id);
    const wasCompleted = currentItem?.completed || false;

    let autoCompletedTasks: string[] = [];

    setTasks(prev => {
      pushUndo(prev);
      let newTasks = updateInTree(prev, id, item => ({ ...item, completed: !item.completed }));

      const toggledItem = findInTree(newTasks, id);

      // Only cascade when completing (not uncompleting)
      if (toggledItem && toggledItem.completed) {
        const path = getPathToItem(newTasks, id);

        // Auto-complete parents if all their subtasks are done
        if (path && path.length > 1) {
          for (let i = path.length - 2; i >= 0; i--) {
            const parentInPath = path[i];
            const parentInTree = findInTree(newTasks, parentInPath.id);

            if (parentInTree && !parentInTree.completed && areAllSubtasksComplete(parentInTree)) {
              newTasks = updateInTree(newTasks, parentInPath.id, item => ({ ...item, completed: true }));
              autoCompletedTasks.push(parentInTree.title);
            }
          }
        }

        // Only celebrate root-level task completions
        const isRootLevel = !path || path.length === 1;

        // Check if a root task was auto-completed
        const rootWasAutoCompleted = path && path.length > 0 &&
          autoCompletedTasks.includes(path[0].title);

        if (rootWasAutoCompleted) {
          // Root task was auto-completed - celebrate!
          setCelebrationMessage(`Summit Conquered: ${path[0].title}`);
          setShowCelebration(true);
        } else if (isRootLevel) {
          // Directly completed a root-level task
          setCelebrationMessage(`Summit Conquered: ${toggledItem.title}`);
          setShowCelebration(true);
        }
      }

      return newTasks;
    });

    // Show toast for auto-completions
    if (autoCompletedTasks.length > 0) {
      const message = autoCompletedTasks.length === 1
        ? `✓ "${autoCompletedTasks[0]}" auto-completed`
        : `✓ ${autoCompletedTasks.length} parent tasks auto-completed`;
      showToast(message, 'success');
    }

    // Record completion for stats (only when marking complete, not uncomplete)
    if (!wasCompleted) {
      console.log('Task completed, recording stats...');
      recordCompletion();
    } else {
      console.log('Task uncompleted, skipping stats.');
    }
  }, [pushUndo, recordCompletion, showToast]);

  const deleteItem = useCallback((id: string) => {
    setTasks(prev => {
      pushUndo(prev);
      return removeFromTree(prev, id);
    });
    if (focusedId === id) setFocusedId(null);
    showToast("Deleted", "info", { label: "Undo", onClick: undo });
  }, [focusedId, pushUndo, showToast, undo]);

  const startEditing = useCallback((item: TaskItem) => {
    setEditingId(item.id);
    setEditValue(item.title);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId) {
      setTasks(prev => {
        pushUndo(prev);
        return updateInTree(prev, editingId, item => ({ ...item, title: editValue }));
      });
      setEditingId(null);
    }
  }, [editingId, editValue, pushUndo]);

  const loadTemplate = useCallback((templateId: string) => {
    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const createTaskFromTemplate = (task: { title: string, subTasks: string[] }): TaskItem => ({
      id: crypto.randomUUID(),
      title: task.title,
      completed: false,
      isBreakingDown: false,
      isExpanded: true,
      createdAt: Date.now(),
      subTasks: task.subTasks.map(subTitle => ({
        id: crypto.randomUUID(),
        title: subTitle,
        completed: false,
        isBreakingDown: false,
        isExpanded: true,
        createdAt: Date.now(),
        subTasks: []
      }))
    });

    const rootTask: TaskItem = {
      id: crypto.randomUUID(),
      title: template.title,
      completed: false,
      isBreakingDown: false,
      isExpanded: true,
      createdAt: Date.now(),
      subTasks: template.tasks.map(createTaskFromTemplate)
    };

    setTasks(prev => {
      pushUndo(prev);
      return [rootTask, ...prev];
    });
    showToast(`Template loaded: ${template.title}`, "success");
  }, [pushUndo, showToast]);

  const handleBreakdownNode = useCallback(async (id: string) => {
    // If we have local AI, we can proceed even without an API Key.
    // If no local AI and no API Key, then fail.
    // The breakDownTask function handles the fallback logic internally.

    const target = findInTree(tasksRef.current, id);
    if (!target) return;
    setTasks(prev => updateInTree(prev, id, item => ({ ...item, isBreakingDown: true })));

    // Pass callback to update UI about who is working
    const steps = await breakDownTask(
      target.title,
      target.subTasks.map(s => s.title),
      (provider, isDownloading) => {
        setLastUsedProvider(provider);
        setIsModelDownloading(isDownloading);
        if (isDownloading) showToast("Downloading Local AI Model...", "info");
      }
    );

    setTasks(prev => updateInTree(prev, id, item => ({
      ...item,
      isBreakingDown: false,
      isExpanded: true,
      subTasks: steps.map(s => ({
        id: crypto.randomUUID(), title: s, completed: false, isBreakingDown: false, isExpanded: true, subTasks: [], createdAt: Date.now()
      }))
    })));

    setIsModelDownloading(false);
  }, [showToast]);

  const isConnectingRef = useRef(false);

  const toggleVoiceMode = async () => {
    if (isAiDisabled) {
      showToast("Visionary requires a valid API key.", "error");
      return;
    }

    if (isConnectingRef.current) return;

    if (isVoiceActive || voiceStatus !== VoiceStatus.IDLE) {
      isConnectingRef.current = true;
      setIsVoiceEnding(true); // Trigger fade-out animation

      // Show session summary toast
      const taskCount = voiceSessionTaskCount;
      const message = taskCount > 0
        ? `Session ended. ${taskCount} task${taskCount === 1 ? '' : 's'} updated.`
        : "Session ended.";

      try {
        await liveSessionRef.current?.disconnect();
      } finally {
        // Delay cleanup slightly to allow fade animation
        setTimeout(() => {
          liveSessionRef.current = null;
          setIsVoiceActive(false);
          setVoiceMode(VisualizerMode.IDLE);
          setVoiceStatus(VoiceStatus.IDLE);
          setTranscript('');
          setIsVoiceEnding(false);
          setVoiceSessionTaskCount(0);
          if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current);
            transcriptTimeoutRef.current = null;
          }
          isConnectingRef.current = false;
          showToast(message, "info");
        }, 500);
      }
    } else {
      isConnectingRef.current = true;
      setVoiceStatus(VoiceStatus.CONNECTING);
      setVoiceMode(VisualizerMode.THINKING);

      try {
        // Voice always uses Cloud for now
        setLastUsedProvider('CLOUD_GEMINI');

        const manager = new LiveSessionManager({
          onOpen: () => {
            setIsVoiceActive(true);
            setVoiceMode(VisualizerMode.LISTENING);
            setVoiceStatus(VoiceStatus.CONNECTED);
            setVoiceSessionTaskCount(0); // Reset task counter for new session
            showToast("Visionary connected.", "success");
            isConnectingRef.current = false;
          },
          onClose: (wasUserClosing) => {
            setIsVoiceActive(false);
            setVoiceStatus(VoiceStatus.IDLE);
            if (!wasUserClosing) showToast("Connection Reset.", "info");
            isConnectingRef.current = false;
          },
          onAudioData: () => { },
          onTranscript: (text) => {
            setTranscript(text);
            // Clear any existing timeout
            if (transcriptTimeoutRef.current) {
              clearTimeout(transcriptTimeoutRef.current);
            }
            // Fade out after 3 seconds of silence
            transcriptTimeoutRef.current = setTimeout(() => {
              setTranscript('');
            }, 3000);
          },
          onVolumeLevel: setAudioVolume,
          onStatusChange: (status) => {
            if (status === 'connecting') setVoiceStatus(VoiceStatus.CONNECTING);
            if (status === 'connected') setVoiceStatus(VoiceStatus.CONNECTED);
          },
          onError: (err) => {
            console.error("Voice Error:", err);
            showToast("Connection failed.", "error");
            setVoiceStatus(VoiceStatus.ERROR);
            isConnectingRef.current = false;
            setTimeout(() => setVoiceStatus(VoiceStatus.IDLE), 3000);
          },
          onToolCall: async (name, args) => {
            if (name === 'getTasks') return tasksRef.current;
            if (name === 'addTask') {
              const parent = args.parentKeyword ? findByKeyword(tasksRef.current, args.parentKeyword) : null;
              addItem(args.title, parent?.id);
              setVoiceSessionTaskCount(prev => prev + 1);
              const location = parent ? `under "${parent.title}"` : 'to the list';
              showToast(`Added: ${args.title}`, "success");
              return { status: 'added', task: args.title, location, message: `Added "${args.title}" ${location}.` };
            }
            if (name === 'markTaskDone') {
              const match = findByKeyword(tasksRef.current, args.keyword);
              if (match) {
                toggleComplete(match.id);
                setVoiceSessionTaskCount(prev => prev + 1);
                showToast(`Completed: ${match.title}`, "success");
                return { status: 'completed', task: match.title, message: `Marked "${match.title}" as complete.` };
              }
              return { status: 'not_found', message: `Could not find a task matching "${args.keyword}".` };
            }
            if (name === 'decomposeTask') {
              const match = findByKeyword(tasksRef.current, args.taskTitle);
              if (match) {
                showToast(`Breaking down: ${match.title}`, "info");
                setVoiceSessionTaskCount(prev => prev + 1);
                // Don't await - let it run async so we don't block the WebSocket
                handleBreakdownNode(match.id).then(() => {
                  showToast(`Expanded: ${match.title}`, "success");
                });
                return { status: 'breaking_down', task: match.title, message: `Breaking down "${match.title}" into steps. They will appear in the list momentarily.` };
              }
              return { status: 'not_found', message: `Could not find a task matching "${args.taskTitle}".` };
            }
            return { error: 'Unknown tool' };
          }
        });

        await manager.connect();
        liveSessionRef.current = manager;
      } catch (e) {
        console.error("Failed to connect:", e);
        isConnectingRef.current = false;
        setVoiceStatus(VoiceStatus.IDLE);
      }
    }
  };

  // Mobile long-press handlers for voice button
  const LONG_PRESS_DURATION = 500; // ms
  const PROGRESS_INTERVAL = 50; // ms

  const handleMicTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouchDeviceRef.current = true;

    // If voice is active, immediately toggle off (no long-press needed to stop)
    if (isVoiceActive) {
      toggleVoiceMode();
      return;
    }

    // Start long-press detection
    let progress = 0;
    setLongPressProgress(0);

    longPressIntervalRef.current = setInterval(() => {
      progress += (PROGRESS_INTERVAL / LONG_PRESS_DURATION) * 100;
      setLongPressProgress(Math.min(progress, 100));
    }, PROGRESS_INTERVAL);

    longPressTimerRef.current = setTimeout(() => {
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
      toggleVoiceMode();
      setLongPressProgress(0);
      if (longPressIntervalRef.current) clearInterval(longPressIntervalRef.current);
    }, LONG_PRESS_DURATION);
  }, [isVoiceActive, toggleVoiceMode]);

  const handleMicTouchEnd = useCallback(() => {
    // Clear timers if released early
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
    setLongPressProgress(0);
  }, []);

  const handleMicClick = useCallback(() => {
    // Only handle click on non-touch devices
    if (!isTouchDeviceRef.current) {
      toggleVoiceMode();
    }
    // Reset touch flag after a short delay to handle both touch and click
    setTimeout(() => { isTouchDeviceRef.current = false; }, 100);
  }, [toggleVoiceMode]);

  return (
    <div className="min-h-screen bg-void text-slate-200 font-sans p-4 md:p-8">
      {/* Celebration Confetti */}
      <Confetti active={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Celebration Badge */}
      {showCelebration && celebrationMessage && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-gradient-to-r from-nebula-600 to-purple-600 px-8 py-4 rounded-2xl shadow-2xl shadow-nebula-500/30 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Check size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest font-bold">Summit Conquered</p>
                <p className="text-white font-semibold">{celebrationMessage.replace('Summit Conquered: ', '')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-nebula-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Intelligence Source Indicator - Moved to Mic Button */}

      {/* API Protocol Guard Banner */}
      {isAiDisabled && !lastUsedProvider && (
        <div className="container mx-auto max-w-3xl mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 text-amber-200 shadow-lg">
            <ShieldAlert className="flex-shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Visionary Offline</p>
              <p className="opacity-80">Intelligence Protocol not found. Voice disabled. Local Neural Core may attempt breakdown if available.</p>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 bg-slate-800/80 border-slate-700/50">
          <Sparkles size={16} className="text-nebula-400" />
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action?.onClick(); setToast(null); }}
              className="ml-2 px-3 py-1 text-xs font-bold text-nebula-400 hover:text-nebula-300 bg-nebula-500/10 hover:bg-nebula-500/20 rounded-lg transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      <div className="container mx-auto max-w-3xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-nebula-100 to-nebula-500 cursor-pointer" onClick={() => setFocusedId(null)}>
              Visionary (Me)
            </h1>
            <p className="text-slate-500 text-[10px] md:text-xs mt-1 uppercase tracking-[0.3em] font-medium flex items-center gap-2">
              Architect of Ambition
            </p>
            {/* Streak & Stats Badge */}
            {progressStats.totalCompleted > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {progressStats.streak > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
                    <span className="text-sm">🔥</span>
                    <span className="font-bold">{progressStats.streak}</span>
                    <span className="opacity-70">day{progressStats.streak !== 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                  <span><span className="text-slate-400 font-medium">{progressStats.weekCompleted}</span> this week</span>
                  <span className="opacity-30">•</span>
                  <span><span className="text-slate-400 font-medium">{progressStats.totalCompleted}</span> total</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Cmd+Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 size={18} />
            </button>
            {/* Export button */}
            <button
              onClick={exportTasks}
              disabled={tasks.length === 0}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export tasks as JSON"
            >
              <Download size={18} />
            </button>
            <div className="relative group/mic isolate">
              {/* Anime Electric Border Effect - Only active when mic is OFF */}
              {!isVoiceActive && (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[125%] h-[125%] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 rounded-full blur-sm opacity-0 animate-electric-pulse -z-10" />
                  <div className="absolute inset-[-3px] rounded-full overflow-hidden -z-10 animate-flash-finish opacity-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-spin-slow opacity-60" />
                  </div>
                </>
              )}

              <div className="relative">
                {/* Long-press progress ring (mobile only) */}
                {longPressProgress > 0 && (
                  <svg className="absolute inset-0 w-14 h-14 -rotate-90 z-30 pointer-events-none" viewBox="0 0 56 56">
                    <circle
                      cx="28" cy="28" r="26"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${longPressProgress * 1.63} 163`}
                      className="text-nebula-400"
                    />
                  </svg>
                )}
                <Button
                  variant={isVoiceActive ? "voice" : "secondary"}
                  onClick={handleMicClick}
                  onTouchStart={handleMicTouchStart}
                  onTouchEnd={handleMicTouchEnd}
                  onTouchCancel={handleMicTouchEnd}
                  disabled={isAiDisabled}
                  className="rounded-full w-14 h-14 !p-0 shadow-2xl relative z-20 border-none ring-1 ring-white/10"
                >
                  {voiceStatus === VoiceStatus.IDLE ? <Mic size={24} /> :
                    voiceStatus === VoiceStatus.CONNECTING ? <Loader2 className="animate-spin" size={24} /> :
                      <MicOff size={24} />}
                </Button>
              </div>

              {/* Subtle Intelligence Indicator */}
              <div className="absolute -top-1 -right-1 z-30 pointer-events-none">
                {lastUsedProvider === 'LOCAL_NANO' && (
                  <div className={`w-6 h-6 rounded-full bg-slate-900 border flex items-center justify-center shadow-lg ${isVoiceActive ? 'border-red-500/50 text-red-400' : 'border-emerald-500/50 text-emerald-400'} ${isModelDownloading ? 'animate-pulse' : ''}`} title="Local Neural Core">
                    <Cpu size={12} />
                  </div>
                )}
                {lastUsedProvider === 'CLOUD_GEMINI' && (
                  <div className={`w-6 h-6 rounded-full bg-slate-900 border flex items-center justify-center shadow-lg ${isVoiceActive ? 'border-red-500/50 text-red-400' : 'border-nebula-500/50 text-nebula-400'}`} title="Cloud Uplink">
                    <CloudLightning size={12} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {(isVoiceActive || isVoiceEnding) && (
          <div className={`mb-10 p-8 glass-panel rounded-3xl flex flex-col items-center justify-center border-nebula-500/20 shadow-2xl transition-all duration-500 ${isVoiceEnding ? 'opacity-0 scale-95' : 'scale-in-center'}`}>
            <Orb mode={voiceMode} volume={audioVolume} />
            <div className="mt-6 flex flex-col items-center gap-1">
              <span className="text-[11px] text-nebula-400 font-bold uppercase tracking-widest opacity-80">
                {isVoiceEnding ? "Session Ending..." : "Vision Aligned"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tighter italic">"Focus on the Peak. I'll handle the Path."</span>
            </div>
            {/* Voice Transcript */}
            <div className={`mt-4 min-h-[2rem] max-w-md text-center transition-opacity duration-500 ${transcript ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-sm text-slate-300 font-light italic">{transcript}</p>
            </div>
          </div>
        )}

        <div className="mb-8 relative group">
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newTaskTitle.trim()) { addItem(newTaskTitle.trim(), focusedId || undefined); setNewTaskTitle(''); } }}
            placeholder={focusedId ? `Expanding "${focusedItem?.title}"...` : "What's the next big goal?"}
            className="w-full bg-slate-900/40 border border-slate-700/30 backdrop-blur-xl rounded-2xl py-4 pl-6 pr-16 outline-none focus:ring-2 focus:ring-nebula-500/40 shadow-2xl text-lg placeholder:text-slate-700"
          />
          <button
            onClick={() => { if (newTaskTitle.trim()) { addItem(newTaskTitle.trim(), focusedId || undefined); setNewTaskTitle(''); } }}
            className="absolute right-3 top-2.5 p-2.5 bg-nebula-600 hover:bg-nebula-500 text-white rounded-xl transition-all shadow-xl active:scale-90"
          >
            <Plus size={24} />
          </button>
        </div>

        {focusedId && breadcrumbs && (
          <nav className="flex items-center flex-wrap gap-2 mb-6 px-2 text-xs md:text-sm text-slate-500 font-medium">
            <button onClick={() => setFocusedId(null)} className="hover:text-nebula-400 flex items-center gap-1">
              <ChevronLeft size={16} /> Summit
            </button>
            {breadcrumbs.slice(0, -1).map(node => (
              <React.Fragment key={node.id}>
                <ChevronRight size={14} className="opacity-30" />
                <button onClick={() => setFocusedId(node.id)} className="hover:text-nebula-400">{node.title}</button>
              </React.Fragment>
            ))}
            <ChevronRight size={14} className="opacity-30" />
            <span className="text-nebula-400 font-bold">{focusedItem?.title}</span>
          </nav>
        )}

        <div className="space-y-4 pb-32">
          {displayItems.map(item => (
            <TaskNode
              key={item.id}
              item={item}
              depth={0}
              editingId={editingId}
              editValue={editValue}
              focusedId={focusedId}
              setEditValue={setEditValue}
              saveEdit={saveEdit}
              startEditing={startEditing}
              toggleComplete={toggleComplete}
              setFocusedId={setFocusedId}
              handleBreakdownNode={handleBreakdownNode}
              deleteItem={deleteItem}
              addItem={addItem}
              setTasks={setTasks}
              isAiDisabled={isAiDisabled}
              activeProvider={lastUsedProvider}
            />
          ))}
          {displayItems.length === 0 && !focusedId && (
            <div className="py-12 flex flex-col items-center gap-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-700 mx-auto mb-3">
                  <Brain size={24} />
                </div>
                <p className="text-slate-700 font-light italic">Define your peak to begin the climb.</p>
                <p className="text-slate-600 text-xs mt-2">Or start with a template:</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                {TASK_TEMPLATES.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template.id)}
                      className="group p-6 glass-panel rounded-2xl text-left hover:border-nebula-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-nebula-500/5"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon size={20} />
                      </div>
                      <h3 className="font-semibold text-slate-200 mb-1">{template.title}</h3>
                      <p className="text-xs text-slate-500">{template.tasks.length} milestones, pre-planned</p>
                    </button>
                  );
                })}
              </div>
              {!isAiDisabled && (
                <p className="text-[10px] text-slate-600 flex items-center gap-2">
                  <Mic size={12} /> Tip: Use voice mode to brainstorm your own vision
                </p>
              )}
            </div>
          )}
          {displayItems.length === 0 && focusedId && (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-700">
                <Plus size={24} />
              </div>
              <p className="text-slate-700 font-light italic">Add steps to reach this milestone.</p>
            </div>
          )}
        </div>
      </div>

      {focusedId && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 animate-fade-in">
          <Button variant="secondary" onClick={() => setFocusedId(null)} icon={Minimize2} className="rounded-full px-8 py-4 shadow-2xl border-nebula-500/50 border-2 text-nebula-100 font-bold">
            Back to Peak
          </Button>
        </div>
      )}

      <style>{`
        @keyframes scale-in-center { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .scale-in-center { animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-electric-pulse {
          animation: electricPulse 4s ease-in-out infinite;
        }
        @keyframes electricPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
        }

        .animate-flash-finish {
           animation: flashFinish 3s ease-out infinite;
           animation-delay: 1s;
        }
        @keyframes flashFinish {
           0% { opacity: 0; }
           30% { opacity: 0.8; }
           100% { opacity: 0; }
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          70% { transform: translate(-50%, -50%) scale(0.9); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div >
  );
}
