
import React from 'react';
import { Agent, ProcessStep } from '../types';

interface AgentCardProps {
  agent: Agent;
  step?: ProcessStep;
  isActive: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, step, isActive }) => {
  const statusColor = step?.status === 'completed' ? 'border-emerald-500/50' : 
                     step?.status === 'error' ? 'border-red-500/50' :
                     isActive ? 'border-blue-500 animate-pulse' : 'border-neutral-800';

  return (
    <div className={`flex flex-col rounded-xl border p-4 transition-all duration-300 bg-neutral-900/40 ${statusColor}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{agent.icon}</span>
        <div>
          <h3 className={`font-bold text-sm uppercase tracking-wider ${agent.color}`}>{agent.name}</h3>
          <p className="text-xs text-neutral-400">{agent.role}</p>
        </div>
        <div className="ml-auto">
          {isActive && (
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          )}
          {step?.status === 'completed' && <span className="text-emerald-500 text-xs font-bold uppercase">Ready</span>}
        </div>
      </div>
      
      <p className="text-xs text-neutral-500 italic mb-4">{agent.description}</p>
      
      {step?.output ? (
        <div className="bg-black/50 rounded-lg p-3 text-sm text-neutral-300 leading-relaxed max-h-60 overflow-y-auto border border-neutral-800/50 whitespace-pre-wrap">
          {step.output}
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center border border-dashed border-neutral-800 rounded-lg">
          <span className="text-xs text-neutral-600">Awaiting data...</span>
        </div>
      )}
    </div>
  );
};

export default AgentCard;
