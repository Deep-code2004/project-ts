
export enum AgentRole {
  IDEA = 'IDEA',
  CRITIC = 'CRITIC',
  REFINER = 'REFINER',
  PRESENTER = 'PRESENTER'
}

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface ProcessStep {
  agentId: string;
  role: AgentRole;
  status: 'pending' | 'active' | 'completed' | 'error';
  output: string;
  timestamp: number;
}

export interface StudioSession {
  id: string;
  prompt: string;
  domain: string;
  steps: ProcessStep[];
  isProcessing: boolean;
}

export const AGENTS: Agent[] = [
  {
    id: 'agent-idea',
    role: AgentRole.IDEA,
    name: 'Spark',
    description: 'Generates creative, high-signal initial concepts.',
    color: 'text-blue-400',
    icon: '💡'
  },
  {
    id: 'agent-critic',
    role: AgentRole.CRITIC,
    name: 'Sentinel',
    description: 'Analyzes feasibility, risks, and missing metrics.',
    color: 'text-red-400',
    icon: '🔍'
  },
  {
    id: 'agent-refiner',
    role: AgentRole.REFINER,
    name: 'Alchemist',
    description: 'Synthesizes feedback to improve the original vision.',
    color: 'text-emerald-400',
    icon: '⚡'
  },
  {
    id: 'agent-presenter',
    role: AgentRole.PRESENTER,
    name: 'Oracle',
    description: 'Polishes the final output into a professional brief.',
    color: 'text-purple-400',
    icon: '📄'
  }
];

export const DOMAINS = [
  { id: 'esg', label: 'ESG Sustainability', icon: '🌱' },
  { id: 'agri', label: 'Regenerative Agriculture', icon: '🚜' },
  { id: 'startup', label: 'Startup Ideation', icon: '🚀' },
  { id: 'creative', label: 'Creative Content', icon: '🎨' },
  { id: 'tech', label: 'Technology Innovation', icon: '💻' },
  { id: 'health', label: 'Healthcare Solutions', icon: '🏥' },
  { id: 'finance', label: 'Financial Services', icon: '💰' },
  { id: 'education', label: 'Education Reform', icon: '📚' }
];
