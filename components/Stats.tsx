import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Task, Priority } from '../types';

interface StatsProps {
  tasks: Task[];
}

const COLORS = {
  [Priority.HIGH]: '#ef4444',   // red-500
  [Priority.MEDIUM]: '#f59e0b', // amber-500
  [Priority.LOW]: '#3b82f6',    // blue-500
  Completed: '#10b981',         // emerald-500
  Remaining: '#94a3b8'          // slate-400
};

const Stats: React.FC<StatsProps> = ({ tasks }) => {
  // Data for Pie Chart (By Priority)
  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === Priority.HIGH && !t.completed).length },
    { name: 'Medium', value: tasks.filter(t => t.priority === Priority.MEDIUM && !t.completed).length },
    { name: 'Low', value: tasks.filter(t => t.priority === Priority.LOW && !t.completed).length },
  ].filter(d => d.value > 0);

  // Data for Bar Chart (Time Estimates)
  const timeData = [
    { name: 'Done', minutes: tasks.filter(t => t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0) },
    { name: 'To Do', minutes: tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0) },
  ];

  if (tasks.length === 0) {
    return <div className="text-center text-slate-400 dark:text-slate-500 py-4">Add tasks to see analytics</div>;
  }

  // Custom tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
          <p className="text-slate-700 dark:text-slate-200 text-sm">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Pending by Priority</h3>
        <div className="h-48">
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              No pending tasks!
            </div>
          )}
        </div>
        <div className="flex justify-center gap-3 text-xs mt-2 dark:text-slate-300">
            {priorityData.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[d.name as keyof typeof COLORS]}} />
                    <span>{d.name}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Time Investment (Minutes)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
              <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={20}>
                {timeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Done' ? COLORS.Completed : COLORS.Remaining} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Stats;