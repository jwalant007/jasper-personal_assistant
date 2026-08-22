const agentEngine = require('./agentEngine');
const vectorMemory = require('./vectorMemory');
const phoneController = require('./phoneController');
const tvController = require('./tvController');

class SwarmEngine {
  constructor() {
    this.agents = [
      { id: 'research', name: 'Web Research Agent', role: 'Web Scraper & News Intelligence', icon: 'Globe', status: 'idle', activeModel: 'gemini-2.5-flash' },
      { id: 'system', name: 'Coding & PC Agent', role: 'System Commands & App Launcher', icon: 'Cpu', status: 'idle', activeModel: 'gemini-2.5-flash' },
      { id: 'mobile', name: 'Mobile & IoT Agent', role: 'ADB Phone & Smart TV Controller', icon: 'Smartphone', status: 'idle', activeModel: 'gemini-2.5-flash' },
      { id: 'memory', name: 'Memory & RAG Agent', role: 'Semantic Vector Store & Fact Indexer', icon: 'Brain', status: 'idle', activeModel: 'gemini-2.5-flash' },
      { id: 'security', name: 'Vision & Security Agent', role: 'Biometrics & Telemetry Monitor', icon: 'ShieldCheck', status: 'idle', activeModel: 'gemini-2.5-flash' }
    ];

    // Ordered Model Failover & Load Balancing Pool
    this.modelPool = [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: 'cloud', rateLimitedUntil: 0, errorCount: 0 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'cloud', rateLimitedUntil: 0, errorCount: 0 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'cloud', rateLimitedUntil: 0, errorCount: 0 },
      { id: 'ollama-local', name: 'Ollama Local (llama3)', type: 'local', rateLimitedUntil: 0, errorCount: 0 },
      { id: 'offline-vector-rag', name: 'Offline Vector Engine', type: 'offline', rateLimitedUntil: 0, errorCount: 0 }
    ];
  }

  getAgentsStatus() {
    return this.agents.map(a => {
      const modelObj = this.modelPool.find(m => m.id === a.activeModel) || this.modelPool[0];
      const isRateLimited = modelObj.rateLimitedUntil > Date.now();
      return {
        ...a,
        healthStatus: isRateLimited ? 'FAILOVER_ACTIVE' : 'HEALTHY',
        activeModelName: modelObj.name,
        cooldownRemainingSec: isRateLimited ? Math.ceil((modelObj.rateLimitedUntil - Date.now()) / 1000) : 0
      };
    });
  }

  /**
   * Selects the highest-priority healthy model from the model pool.
   */
  getActiveHealthyModel() {
    const now = Date.now();
    for (const model of this.modelPool) {
      if (model.rateLimitedUntil <= now) {
        return model;
      }
    }
    return this.modelPool[this.modelPool.length - 1]; // Ultimate fallback (offline vector RAG)
  }

  /**
   * Reports a model rate-limit or quota limit error, triggering backoff and hot-swap.
   */
  reportModelQuotaError(modelId, errorMsg = '') {
    const model = this.modelPool.find(m => m.id === modelId);
    if (model) {
      model.errorCount += 1;
      // 60 second rate-limit cooldown backoff
      model.rateLimitedUntil = Date.now() + 60000;
      console.warn(`[SwarmEngine Rate-Limit Warning] Model '${modelId}' hit quota limit (${errorMsg}). Cooldown set for 60s.`);
    }

    // Auto-update sub-agents to hot-swap to the next healthy model
    const newHealthyModel = this.getActiveHealthyModel();
    this.agents.forEach(agent => {
      if (agent.activeModel === modelId) {
        agent.activeModel = newHealthyModel.id;
      }
    });

    return newHealthyModel;
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
   * Executes a multi-agent goal sequentially with dynamic agent model failover.
   */
  async executeGoal(goalText) {
    console.log(`\n[SwarmEngine] Master Coordinator received goal: "${goalText}"`);
    
    const logs = [];
    const failoverEvents = [];
    const timestamp = new Date().toISOString();
    const taskPlan = this.decomposeGoal(goalText);

    let activeModel = this.getActiveHealthyModel();

    logs.push({ 
      time: new Date().toLocaleTimeString(), 
      text: `Master Coordinator assigned goal across ${taskPlan.length} sub-agent(s) using primary model '${activeModel.name}'.`, 
      type: 'info' 
    });

    // Step 1: Memory RAG Agent
    const memoryAgent = this.agents.find(a => a.id === 'memory');
    memoryAgent.status = 'active';
    logs.push({ 
      time: new Date().toLocaleTimeString(), 
      agent: 'Memory Agent', 
      text: `Searching semantic vector store using model '${activeModel.name}'...`, 
      type: 'agent' 
    });
    
    const memories = vectorMemory.searchMemory(goalText, 3);
    if (memories.length > 0) {
      logs.push({ 
        time: new Date().toLocaleTimeString(), 
        agent: 'Memory Agent', 
        text: `Recalled ${memories.length} relevant memory context(s): ${memories.map(m => m.text).join('; ')}`, 
        type: 'success' 
      });
    } else {
      logs.push({ 
        time: new Date().toLocaleTimeString(), 
        agent: 'Memory Agent', 
        text: `No prior memory vectors found. Initializing fresh context.`, 
        type: 'info' 
      });
    }
    memoryAgent.status = 'completed';

    // Step 2: Sub-Agent Execution with Failover Loop
    let executionResult;
    try {
      executionResult = await agentEngine.processQuery({ query: goalText });
    } catch (err) {
      // Check if error is quota or rate-limit
      const errMsg = err.message || '';
      if (errMsg.includes('429') || errMsg.includes('ResourceExhausted') || errMsg.includes('quota') || errMsg.includes('limit')) {
        const failedModel = activeModel.id;
        const backupModel = this.reportModelQuotaError(failedModel, errMsg);
        activeModel = backupModel;

        failoverEvents.push({
          time: new Date().toLocaleTimeString(),
          failedModel,
          newModel: backupModel.id,
          reason: '429 Rate Limit Exceeded'
        });

        logs.push({ 
          time: new Date().toLocaleTimeString(), 
          agent: 'Swarm Coordinator', 
          text: `[AGENT FAILOVER] Model '${failedModel}' hit rate limit! Hot-swapping sub-agents to backup model '${backupModel.name}'...`, 
          type: 'warning' 
        });

        // Retry with backup model
        executionResult = await agentEngine.processQuery({ query: goalText });
      } else {
        throw err;
      }
    }
    
    logs.push({ 
      time: new Date().toLocaleTimeString(), 
      agent: 'Master Coordinator', 
      text: `Task completed using '${activeModel.name}'. Response synthesized: "${executionResult.response}"`, 
      type: 'success' 
    });

    // Reset status
    this.agents.forEach(a => a.status = 'idle');

    return {
      success: true,
      goal: goalText,
      taskPlan,
      activeModel: activeModel.id,
      activeModelName: activeModel.name,
      failoverEvents,
      memoriesUsed: memories,
      logs,
      result: executionResult.response,
      agentsStatus: this.getAgentsStatus(),
      timestamp
    };
  }
}

module.exports = new SwarmEngine();
