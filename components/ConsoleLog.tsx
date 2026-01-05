
import React from 'react';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'agent';
  timestamp: number;
}

interface ConsoleLogProps {
  logs: LogEntry[];
}

const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs }) => {
  const logEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black rounded-lg border border-neutral-800 p-3 h-48 overflow-y-auto mono text-xs">
      <div className="text-neutral-500 mb-2 font-bold uppercase tracking-widest text-[10px]">System Execution Trace</div>
      {logs.map((log, idx) => {
        const color = log.type === 'success' ? 'text-emerald-500' :
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'agent' ? 'text-blue-400' :
                    log.type === 'warning' ? 'text-amber-500' : 'text-neutral-400';
        
        return (
          <div key={idx} className="mb-1 flex gap-2">
            <span className="text-neutral-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span className={color}>{log.message}</span>
          </div>
        );
      })}
      <div ref={logEndRef} />
    </div>
  );
};

export default ConsoleLog;
