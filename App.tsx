import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Check, Trash2, Brain, Bell, Clock, AlertCircle, Loader2, Sparkles, X, Palette, Moon, Sun } from 'lucide-react';
import { Task, Priority, ThemeType, ThemeConfig } from './types';
import ProgressBar from './components/ProgressBar';
import Stats from './components/Stats';
import { breakDownGoal, suggestEncouragement } from './services/geminiService';
import { requestNotificationPermission, sendNotification } from './services/notificationService';

// Theme Configurations
const THEMES: Record<ThemeType, ThemeConfig> = {
  light: { name: 'Classic', primary: 'indigo', bg: 'bg-slate-50', isDark: false },
  dark: { name: 'Midnight', primary: 'violet', bg: 'bg-slate-900', isDark: true },
  nature: { name: 'Nature', primary: 'emerald', bg: 'bg-stone-50', isDark: false },
  ocean: { name: 'Ocean', primary: 'cyan', bg: 'bg-slate-900', isDark: true },
  sunset: { name: 'Sunset', primary: 'rose', bg: 'bg-orange-50', isDark: false },
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [showEncouragement, setShowEncouragement] = useState(false);
  
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const theme = THEMES[currentTheme];

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mindful-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
    const savedTheme = localStorage.getItem('mindful-theme');
    if (savedTheme && THEMES[savedTheme as ThemeType]) {
      setCurrentTheme(savedTheme as ThemeType);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('mindful-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Update Theme in LocalStorage and DOM
  useEffect(() => {
    localStorage.setItem('mindful-theme', currentTheme);
    
    // Toggle dark mode class on HTML element
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme, theme.isDark]);

  // Request notification permissions
  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    if (granted) sendNotification("Notifications Enabled", "You'll now get task reminders!");
  };

  // Add simple task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: inputValue,
      completed: false,
      priority: Priority.MEDIUM,
      estimatedMinutes: 15, // Default
      createdAt: Date.now(),
    };

    setTasks(prev => [newTask, ...prev]);
    setInputValue('');
  };

  // Smart Breakdown
  const handleSmartBreakdown = async () => {
    if (!inputValue.trim()) return;
    setIsAiLoading(true);
    
    try {
      const breakdown = await breakDownGoal(inputValue);
      if (breakdown && breakdown.subtasks.length > 0) {
        const newTasks: Task[] = breakdown.subtasks.map(t => ({
          id: crypto.randomUUID(),
          title: t.title,
          completed: false,
          priority: t.priority,
          estimatedMinutes: t.estimatedMinutes,
          createdAt: Date.now()
        }));
        setTasks(prev => [...newTasks, ...prev]);
        setInputValue('');
      } else {
        alert("Could not break down this task. Try being more specific.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle Complete
  const toggleTask = useCallback(async (id: string) => {
    let justCompleted = false;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) justCompleted = true;
        return { ...t, completed: !t.completed };
      }
      return t;
    }));

    if (justCompleted) {
      const completedCount = tasks.filter(t => t.completed).length + 1;
      if (completedCount % 3 === 0 || completedCount === 1) {
        const msg = await suggestEncouragement(completedCount);
        setEncouragement(msg);
        setShowEncouragement(true);
        setTimeout(() => setShowEncouragement(false), 4000);
      }
    }
  }, [tasks]);

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Set Reminder
  const setReminder = (id: string, minutes: number) => {
    const targetTime = Date.now() + minutes * 60000;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, reminderTime: targetTime } : t));
    
    sendNotification("Reminder Set", `We'll remind you in ${minutes} minutes.`);
    
    setTimeout(() => {
        const currentTask = tasks.find(t => t.id === id); 
        sendNotification("Task Reminder", "Time to work on your task!");
    }, minutes * 60000);
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className={`min-h-screen ${theme.bg} text-slate-800 dark:text-slate-100 pb-20 relative overflow-hidden transition-colors duration-500`}>
      
      {/* Background Animations */}
      <BackgroundAnimation theme={currentTheme} />

      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors duration-500">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-${theme.primary}-600 transition-colors duration-500`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-${theme.primary}-600 to-purple-600 dark:from-${theme.primary}-400 dark:to-purple-400 transition-all duration-500`}>
              MindfulTask
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Change Theme"
              >
                <Palette className="w-5 h-5" />
              </button>
              
              {showThemeMenu && (
                 <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Select Theme</p>
                    {Object.entries(THEMES).map(([key, config]) => (
                      <button 
                        key={key}
                        onClick={() => { setCurrentTheme(key as ThemeType); setShowThemeMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${currentTheme === key ? `text-${theme.primary}-600 font-medium` : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        <span className="flex items-center gap-2">
                            {config.isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                            {config.name}
                        </span>
                        {currentTheme === key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={handleRequestPermissions}
              className={`p-2 rounded-full transition-colors ${notificationStatus === 'granted' ? `text-${theme.primary}-600 bg-${theme.primary}-50 dark:bg-${theme.primary}-900/30` : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Notification Settings"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 relative z-10">
        
        {/* Progress Section */}
        <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-500">
           <ProgressBar current={completedTasks.length} total={tasks.length} />
        </section>

        {/* Input Section */}
        <section className="relative group">
          <form onSubmit={addTask} className="relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What do you need to get done?"
              className={`w-full pl-4 pr-32 py-4 text-lg rounded-2xl border-none shadow-lg shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-${theme.primary}-500/20 bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-400 transition-all outline-none`}
            />
            <div className="absolute right-2 top-2 bottom-2 flex gap-1">
              <button
                type="button"
                onClick={handleSmartBreakdown}
                disabled={!inputValue || isAiLoading}
                className={`flex items-center gap-1 px-3 py-1 bg-${theme.primary}-50 dark:bg-${theme.primary}-900/30 hover:bg-${theme.primary}-100 dark:hover:bg-${theme.primary}-900/50 text-${theme.primary}-700 dark:text-${theme.primary}-300 rounded-xl transition-colors disabled:opacity-50`}
                title="Use AI to break this down"
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                <span className="text-xs font-semibold hidden sm:inline">Smart</span>
              </button>
              <button 
                type="submit"
                disabled={!inputValue}
                className={`w-10 h-10 bg-${theme.primary}-600 hover:bg-${theme.primary}-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md shadow-${theme.primary}-200 dark:shadow-none`}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </form>
          <div className="mt-2 flex gap-4 text-xs text-slate-400 dark:text-slate-500 px-2">
            <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> AI Powered</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Auto-save</span>
          </div>
        </section>

        {/* Tasks List */}
        <div className="space-y-6">
          
          {/* Active Tasks */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Tasks ({pendingTasks.length})</h2>
            {pendingTasks.length === 0 ? (
               <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors duration-500">
                 <div className="bg-slate-50 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Clock className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                 </div>
                 <p className="text-slate-500 dark:text-slate-400">All caught up! Add a goal to start.</p>
               </div>
            ) : (
              pendingTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={() => toggleTask(task.id)} 
                  onDelete={() => deleteTask(task.id)}
                  onRemind={(min) => setReminder(task.id, min)}
                  primaryColor={theme.primary}
                />
              ))
            )}
          </div>

          {/* Completed Tasks Accordion-style */}
          {completedTasks.length > 0 && (
            <div className="space-y-3 opacity-75">
               <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Completed ({completedTasks.length})</h2>
               {completedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={() => toggleTask(task.id)} 
                  onDelete={() => deleteTask(task.id)}
                  onRemind={() => {}}
                  primaryColor={theme.primary}
                />
              ))}
            </div>
          )}
        </div>

        {/* Charts Section */}
        <Stats tasks={tasks} />

      </main>

      {/* Encouragement Toast */}
      {showEncouragement && encouragement && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 dark:text-yellow-500" />
            <span className="font-medium">{encouragement}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Background Component ---
const BackgroundAnimation = ({ theme }: { theme: ThemeType }) => {
  // Config for blob colors based on theme
  const colors = {
    light: ['bg-purple-300', 'bg-indigo-300', 'bg-pink-300'],
    dark: ['bg-violet-900', 'bg-indigo-900', 'bg-blue-900'], // Darker blobs
    nature: ['bg-emerald-200', 'bg-teal-200', 'bg-green-200'],
    ocean: ['bg-cyan-900', 'bg-blue-900', 'bg-teal-900'],
    sunset: ['bg-orange-200', 'bg-rose-200', 'bg-red-200'],
  };

  const currentColors = colors[theme];
  const opacity = THEMES[theme].isDark ? 'opacity-30' : 'opacity-40';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className={`absolute top-0 left-1/4 w-96 h-96 ${currentColors[0]} rounded-full mix-blend-multiply filter blur-3xl ${opacity} animate-blob`}></div>
      <div className={`absolute top-0 right-1/4 w-96 h-96 ${currentColors[1]} rounded-full mix-blend-multiply filter blur-3xl ${opacity} animate-blob animation-delay-2000`}></div>
      <div className={`absolute -bottom-32 left-1/3 w-96 h-96 ${currentColors[2]} rounded-full mix-blend-multiply filter blur-3xl ${opacity} animate-blob animation-delay-4000`}></div>
      {/* Texture overlay for visual interest */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-slate-100/[0.02] bg-[bottom_1px_center]" style={{maskImage: 'linear-gradient(to bottom, transparent, black)'}}></div>
    </div>
  );
};

// --- Helper Component: TaskItem ---
interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onRemind: (minutes: number) => void;
  primaryColor: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onRemind, primaryColor }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
      case Priority.MEDIUM: return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30';
      case Priority.LOW: return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  return (
    <div className={`group bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all duration-300 ${task.completed ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50' : `border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-${primaryColor}-200 dark:hover:border-${primaryColor}-800`}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={onToggle}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-emerald-500 border-emerald-500' : `border-slate-300 dark:border-slate-600 hover:border-${primaryColor}-500 dark:hover:border-${primaryColor}-400`}`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
             <span className={`text-base font-medium truncate transition-all ${task.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
              {task.title}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.estimatedMinutes}m
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
           {/* Reminder Menu */}
           {!task.completed && (
             <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 text-slate-400 hover:text-${primaryColor}-600 hover:bg-${primaryColor}-50 dark:hover:bg-${primaryColor}-900/30 rounded-lg transition-colors`}
                  title="Set Reminder"
                >
                  <Bell className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Remind me in...</p>
                    {[15, 30, 60].map(min => (
                      <button 
                        key={min}
                        onClick={() => { onRemind(min); setShowMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-${primaryColor}-50 dark:hover:bg-slate-700 hover:text-${primaryColor}-600 flex items-center justify-between`}
                      >
                        {min} mins
                      </button>
                    ))}
                  </div>
                  </>
                )}
             </div>
           )}

           <button 
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Delete"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default App;