const agentEngine = require('./agentEngine');
const vectorMemory = require('./vectorMemory');
const phoneController = require('./phoneController');
const tvController = require('./tvController');

class SwarmEngine {
  constructor() {
    this.agents = [
      { id: 'research', name: 'Web Research Agent', role: 'Web Scraper & News Intelligence', icon: 'Globe', status: 'idle' },
      { id: 'system', name: 'Coding & PC Agent', role: 'System Commands & App Launcher', icon: 'Cpu', status: 'idle' },
      { id: 'mobile', name: 'Mobile & IoT Agent', role: 'ADB Phone & Smart TV Controller', icon: 'Smartphone', status: 'idle' },
      { id: 'memory', name: 'Memory & RAG Agent', role: 'Semantic Vector Store & Fact Indexer', icon: 'Brain', status: 'idle' },
      { id: 'security', name: 'Vision & Security Agent', role: 'Biometrics & Telemetry Monitor', icon: 'ShieldCheck', status: 'idle' }
    ];
  }

  getAgentsStatus() {
    return this.agents;
  }

  /**
   * Decomposes a high-level goal into specialized sub-agent tasks.
   */
  decomposeGoal(goalText) {
    const lower = goalText.toLowerCase();
    const tasks = [];

    // Memory sub-agent check
    tasks.push({
      agentId: 'memory',
      description: `Recall relevant user context for "${goalText}"`,
      status: 'pending'
    });

    // Research sub-agent check
    if (lower.includes('research') || lower.includes('search') || lower.includes('news') || lower.includes('weather') || lower.includes('stock')) {
      tasks.push({
        agentId: 'research',
        description: `Gather real-time web intelligence for query`,
        status: 'pending'
      });
    }

    // System sub-agent check
    if (lower.includes('volume') || lower.includes('launch') || lower.includes('open') || lower.includes('pc') || lower.includes('app')) {
      tasks.push({
        agentId: 'system',
        description: `Execute system hardware & desktop app controls`,
        status: 'pending'
      });
    }

    // Mobile / IoT sub-agent check
    if (lower.includes('tv') || lower.includes('phone') || lower.includes('sms') || lower.includes('call')) {
      tasks.push({
        agentId: 'mobile',
        description: `Dispatch remote command to connected Smart TV / Android Phone`,
        status: 'pending'
      });
    }

    // Vision / Security check
    if (lower.includes('face') || lower.includes('biometrics') || lower.includes('audit') || lower.includes('security') || lower.includes('vitals')) {
      tasks.push({
        agentId: 'security',
        description: `Perform biometrics telemetry scan and health diagnostic check`,
        status: 'pending'
      });
    }

    return tasks;
  }

  /**
   * Executes a multi-agent goal sequentially across sub-agents.
   */
  async executeGoal(goalText) {
    console.log(`\n[SwarmEngine] Master Coordinator received goal: "${goalText}"`);
    
    const logs = [];
    const timestamp = new Date().toISOString();
    const taskPlan = this.decomposeGoal(goalText);

    logs.push({ time: new Date().toLocaleTimeString(), text: `Master Coordinator decomposed goal into ${taskPlan.length} sub-agent step(s).`, type: 'info' });

    // Step 1: Memory RAG Agent
    this.agents.find(a => a.id === 'memory').status = 'active';
    logs.push({ time: new Date().toLocaleTimeString(), agent: 'Memory Agent', text: `Searching semantic vector store for memories related to "${goalText}"...`, type: 'agent' });
    
    const memories = vectorMemory.searchMemory(goalText, 3);
    if (memories.length > 0) {
      logs.push({ time: new Date().toLocaleTimeString(), agent: 'Memory Agent', text: `Recalled ${memories.length} relevant memory context(s): ${memories.map(m => m.text).join('; ')}`, type: 'success' });
    } else {
      logs.push({ time: new Date().toLocaleTimeString(), agent: 'Memory Agent', text: `No prior memory vectors found. Initializing fresh context.`, type: 'info' });
    }
    this.agents.find(a => a.id === 'memory').status = 'completed';

    // Step 2: System / Mobile / Research Agents via AgentEngine
    const executionResult = await agentEngine.processQuery({ query: goalText });
    
    logs.push({ time: new Date().toLocaleTimeString(), agent: 'Master Coordinator', text: `Execution complete. Response synthesized: "${executionResult.response}"`, type: 'success' });

    // Reset status
    this.agents.forEach(a => a.status = 'idle');

    return {
      success: true,
      goal: goalText,
      taskPlan,
      memoriesUsed: memories,
      logs,
      result: executionResult.response,
      timestamp
    };
  }
}

module.exports = new SwarmEngine();
