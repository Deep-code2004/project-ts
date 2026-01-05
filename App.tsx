
import React, { useState, useCallback, useEffect } from 'react';
import { AgentRole, AGENTS, DOMAINS, StudioSession, ProcessStep } from './types';
import { runAgentStep } from './services/geminiService';
import AgentCard from './components/AgentCard';
import ConsoleLog from './components/ConsoleLog';

const STORAGE_KEY = 'multi-agent-studio-sessions';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0].id);
  const [session, setSession] = useState<StudioSession | null>(null);
  const [logs, setLogs] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' | 'agent'; timestamp: number }[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1);
  const [savedSessions, setSavedSessions] = useState<StudioSession[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'agent' = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: Date.now() }]);
  };

  // Load saved sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSessions(parsed);
      } catch (error) {
        console.error('Failed to load saved sessions:', error);
      }
    }
  }, []);

  // Save session when completed
  useEffect(() => {
    if (session && !session.isProcessing && session.steps.every(step => step.status === 'completed')) {
      const updatedSessions = [session, ...savedSessions.filter(s => s.id !== session.id)].slice(0, 10); // Keep last 10
      setSavedSessions(updatedSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    }
  }, [session, savedSessions]);

  const handleStartProcess = async () => {
    if (!prompt.trim() || isStarting) return;

    setIsStarting(true);
    try {
      const newSession: StudioSession = {
      id: Math.random().toString(36).substr(2, 9),
      prompt,
      domain: selectedDomain,
      isProcessing: true,
      steps: AGENTS.map(agent => ({
        agentId: agent.id,
        role: agent.role,
        status: 'pending',
        output: '',
        timestamp: Date.now()
      }))
    };

    setSession(newSession);
    setLogs([]);
    addLog(`Initializing multi-agent workflow for: "${selectedDomain}"`, 'info');
    addLog(`Goal: ${prompt.substring(0, 50)}...`, 'info');
    
    // Orchestrate agents
    let accumulatedContext = '';

    // Run IDEA and CRITIC in parallel
    const [ideaOutput, criticOutput] = await Promise.all([
      (async () => {
        setActiveStepIdx(0);
        setSession(prev => {
          if (!prev) return null;
          const newSteps = [...prev.steps];
          newSteps[0].status = 'active';
          return { ...prev, steps: newSteps };
        });
        addLog(`Agent [Spark] activated. Thinking...`, 'agent');
        try {
          const output = await runAgentStep(AGENTS[0].role, prompt, '', selectedDomain);
          setSession(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[0].status = 'completed';
            newSteps[0].output = output;
            newSteps[0].timestamp = Date.now();
            return { ...prev, steps: newSteps };
          });
          addLog(`Agent [Spark] completed task. Output synthesized.`, 'success');
          return output;
        } catch (error) {
          addLog(`Agent [Spark] encountered an error. Stopping pipeline.`, 'error');
          setSession(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[0].status = 'error';
            return { ...prev, isProcessing: false, steps: newSteps };
          });
          throw error;
        }
      })(),
      (async () => {
        setActiveStepIdx(1);
        setSession(prev => {
          if (!prev) return null;
          const newSteps = [...prev.steps];
          newSteps[1].status = 'active';
          return { ...prev, steps: newSteps };
        });
        addLog(`Agent [Sentinel] activated. Thinking...`, 'agent');
        try {
          const output = await runAgentStep(AGENTS[1].role, prompt, '', selectedDomain);
          setSession(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[1].status = 'completed';
            newSteps[1].output = output;
            newSteps[1].timestamp = Date.now();
            return { ...prev, steps: newSteps };
          });
          addLog(`Agent [Sentinel] completed task. Output synthesized.`, 'success');
          return output;
        } catch (error) {
          addLog(`Agent [Sentinel] encountered an error. Stopping pipeline.`, 'error');
          setSession(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[1].status = 'error';
            return { ...prev, isProcessing: false, steps: newSteps };
          });
          throw error;
        }
      })()
    ]);

    accumulatedContext = `\n\n--- Output from IDEA ---\n${ideaOutput}\n\n--- Output from CRITIC ---\n${criticOutput}`;

    // Run REFINER
    setActiveStepIdx(2);
    setSession(prev => {
      if (!prev) return null;
      const newSteps = [...prev.steps];
      newSteps[2].status = 'active';
      return { ...prev, steps: newSteps };
    });
    addLog(`Agent [Alchemist] activated. Thinking...`, 'agent');
    try {
      const refinerOutput = await runAgentStep(AGENTS[2].role, prompt, accumulatedContext, selectedDomain);
      accumulatedContext += `\n\n--- Output from REFINER ---\n${refinerOutput}`;
      setSession(prev => {
        if (!prev) return null;
        const newSteps = [...prev.steps];
        newSteps[2].status = 'completed';
        newSteps[2].output = refinerOutput;
        newSteps[2].timestamp = Date.now();
        return { ...prev, steps: newSteps };
      });
      addLog(`Agent [Alchemist] completed task. Output synthesized.`, 'success');
    } catch (error) {
      addLog(`Agent [Alchemist] encountered an error. Stopping pipeline.`, 'error');
      setSession(prev => {
        if (!prev) return null;
        const newSteps = [...prev.steps];
        newSteps[2].status = 'error';
        return { ...prev, isProcessing: false, steps: newSteps };
      });
      throw error;
    }

    // Run PRESENTER
    setActiveStepIdx(3);
    setSession(prev => {
      if (!prev) return null;
      const newSteps = [...prev.steps];
      newSteps[3].status = 'active';
      return { ...prev, steps: newSteps };
    });
    addLog(`Agent [Oracle] activated. Thinking...`, 'agent');
    try {
      const presenterOutput = await runAgentStep(AGENTS[3].role, prompt, accumulatedContext, selectedDomain);
      setSession(prev => {
        if (!prev) return null;
        const newSteps = [...prev.steps];
        newSteps[3].status = 'completed';
        newSteps[3].output = presenterOutput;
        newSteps[3].timestamp = Date.now();
        return { ...prev, steps: newSteps };
      });
      addLog(`Agent [Oracle] completed task. Output synthesized.`, 'success');
    } catch (error) {
      addLog(`Agent [Oracle] encountered an error. Stopping pipeline.`, 'error');
      setSession(prev => {
        if (!prev) return null;
        const newSteps = [...prev.steps];
        newSteps[3].status = 'error';
        return { ...prev, isProcessing: false, steps: newSteps };
      });
      throw error;
    }

    setActiveStepIdx(-1);
    setSession(prev => prev ? { ...prev, isProcessing: false } : null);
    addLog(`Pipeline complete. Final presentation ready.`, 'success');
    } catch (error) {
      addLog(`Process failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setSession(prev => prev ? { ...prev, isProcessing: false } : null);
    } finally {
      setIsStarting(false);
    }
  };

  const reset = () => {
    setPrompt('');
    setSession(null);
    setLogs([]);
    setActiveStepIdx(-1);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-500 bg-clip-text text-transparent">
            Multi-Agent Creative Studio
          </h1>
          <p className="text-neutral-400 mt-2 max-w-2xl">
            Simulating high-performing team dynamics through specialized AI agents. 
            Generating, critiquing, and polishing ideas at speed.
          </p>
        </div>
        <div className="flex gap-2">
          {savedSessions.length > 0 && !session && (
            <button
              onClick={() => setSession(savedSessions[0])}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium transition-colors border border-neutral-700"
            >
              Load Latest Session
            </button>
          )}
          {session && (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium transition-colors border border-neutral-700"
            >
              Start New Project
            </button>
          )}
        </div>
      </header>

      {!session ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          <div className="bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 w-full shadow-2xl">
            <label className="block text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6">
              Step 1: Choose Domain
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomain(d.id)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    selectedDomain === d.id 
                    ? 'border-blue-500 bg-blue-500/10 text-white' 
                    : 'border-neutral-800 bg-black/30 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{d.icon}</div>
                  <div className="text-[10px] font-bold uppercase tracking-tighter">{d.label}</div>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold uppercase tracking-widest text-neutral-500 mb-2">
              Step 2: Define your Goal
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Design a community-led regenerative farming program for arid climates..."
              className="w-full h-32 bg-black border border-neutral-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors mb-6 resize-none"
            />

            <button
              onClick={handleStartProcess}
              disabled={!prompt.trim() || isStarting}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                prompt.trim() && !isStarting
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Initializing...
                </>
              ) : (
                'Initialize Agent Team'
              )}
            </button>
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-4">
            {AGENTS.map(agent => (
              <div key={agent.id} className="text-center opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                <div className="text-3xl mb-2">{agent.icon}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{agent.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-full pb-10">
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AGENTS.map((agent, idx) => (
                <AgentCard 
                  key={agent.id}
                  agent={agent}
                  step={session.steps[idx]}
                  isActive={activeStepIdx === idx}
                />
              ))}
            </div>
            <ConsoleLog logs={logs} />
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800 p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Project Brief</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400 uppercase">{selectedDomain}</span>
              </div>
              <h2 className="text-xl font-bold mb-4 line-clamp-2 italic text-neutral-300">"{session.prompt}"</h2>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {session.steps[3].output ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-neutral-400 leading-relaxed text-sm">
                      {session.steps[3].output}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-xs text-neutral-500 max-w-[200px]">The "Oracle" is waiting for the refined concept before drafting the final presentation.</p>
                  </div>
                )}
              </div>

              {session.steps[3].status === 'completed' && (
                <div className="mt-6 space-y-2">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10"
                      onClick={() => {
                        const blob = new Blob([session.steps[3].output], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `agent-studio-output-${selectedDomain}.txt`;
                        a.click();
                      }}
                    >
                      Export TXT
                    </button>
                    <button
                      className="flex-1 py-2 bg-emerald-600 text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                      onClick={() => {
                        const exportData = {
                          session: {
                            id: session.id,
                            prompt: session.prompt,
                            domain: session.domain,
                            completedAt: new Date().toISOString()
                          },
                          agents: session.steps.map((step, idx) => ({
                            agent: AGENTS[idx].name,
                            role: step.role,
                            output: step.output
                          })),
                          finalOutput: session.steps[3].output
                        };
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `agent-studio-session-${session.id}.json`;
                        a.click();
                      }}
                    >
                      Export JSON
                    </button>
                  </div>
                  <button
                    className="w-full py-2 bg-purple-600 text-white font-bold uppercase text-xs tracking-widest rounded-lg hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20"
                    onClick={() => {
                      const markdown = `# Multi-Agent Creative Studio Output\n\n**Domain:** ${session.domain}\n**Prompt:** ${session.prompt}\n\n## Final Presentation\n\n${session.steps[3].output}\n\n## Agent Contributions\n\n${session.steps.map((step, idx) => `### ${AGENTS[idx].name} (${step.role})\n\n${step.output}\n\n`).join('')}`;
                      const blob = new Blob([markdown], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `agent-studio-output-${selectedDomain}.md`;
                      a.click();
                    }}
                  >
                    Export Markdown
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Collaboration Stats</h4>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-500">Agents Involved:</span>
                <span className="text-neutral-300">4 Experts</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-500">Feedback Loops:</span>
                <span className="text-neutral-300">Sequential Refinement</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Model:</span>
                <span className="text-neutral-300">Gemini 3 Flash</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <footer className="mt-auto pt-8 pb-4 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">
        <div>© 2024 Multi-Agent Creative Studio</div>
        <div className="flex gap-4">
          <span>Innovation</span>
          <span>Sustainability</span>
          <span>Agentic AI</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
