# J.A.S.P.E.R. ARCHITECTURE SPECIFICATION
## Unified Personal AI Operating System (JARVIS-Class Architecture)

> **Document Version:** 2.0.0  
> **System Codename:** J.A.S.P.E.R. Core OS  
> **Architecture Style:** Orchestrated Multi-Agent Hybrid Edge/Cloud Operating Environment  

---

## 1. System Overview & Core Philosophy

J.A.S.P.E.R. (Just Another Super Personal Assistant) operates as a centralized, OS-level AI intelligence layer designed to coordinate local hardware, telephony, financial intelligence, cloud APIs, and multimedia creative tools through a unified conversational interface.

Rather than fragmenting AI reasoning across disparate widgets, **all natural language directives flow through a singular Central Orchestrator**. The orchestrator manages conversational state, determines user intent, delegates tasks to specialized domain sub-agents, enforces strict zero-trust permissions, and provides streaming feedback to the client interface.

```
                           ┌────────────────────────┐
                           │      USER DIRECTIVE     │
                           │  (Voice / Text / API)  │
                           └───────────┬────────────┘
                                       │
                                       ▼
                     ┌──────────────────────────────────┐
                     │    JASPER AI CORE ORCHESTRATOR   │
                     │  (agentEngine.js / Context Core) │
                     └─────────┬──────────────┬─────────┘
                               │              │
           ┌───────────────────┴───┐      ┌───┴───────────────────┐
           ▼                       ▼      ▼                       ▼
┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│ CONVERSATION MEMORY │  │ SEMANTIC VECTOR  │  │ PERMISSION LAYER    │
│ Multi-Turn Context  │  │ Memory Store     │  │ L0 - L3 Zero-Trust  │
└─────────────────────┘  └──────────────────┘  └──────────┬──────────┘
                                                          │
                                                          ▼
                                            ┌─────────────────────────┐
                                            │ SPECIALIZED AGENT SWARM │
                                            └─────────────┬───────────┘
                                                          │
        ┌──────────────┬──────────────┬─────────────┬─────┴────────┬──────────────┬─────────────┐
        ▼              ▼              ▼             ▼              ▼              ▼             ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌───────────┐
  │  FINANCE  │  │ TELEPHONY │  │  COMMS    │ │  DEVICE   │  │    3D     │  │ RESEARCH  │ │ SECURITY  │
  │   AGENT   │  │   AGENT   │  │   AGENT   │ │   AGENT   │  │   AGENT   │  │   AGENT   │ │   AGENT   │
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ └─────┬─────┘
        │              │              │             │              │              │             │
        ▼              ▼              ▼             ▼              ▼              ▼             ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌───────────┐
  │ Pay Vault │  │ ADB Phone │  │ WhatsApp  │ │ Smart TV  │  │  Blender  │  │ DuckDuckGo│ │ Lock      │
  │ & Budget  │  │ & Carrier │  │ & IG DM   │ │ & PC Core │  │  4.x CLI  │  │ & Vector  │ │ Shield    │
  └───────────┘  └───────────┘  └───────────┘ └───────────┘  └───────────┘  └───────────┘ └───────────┘
```

---

## 2. Core Architectural Subsystems

### 2.1 Central AI Orchestrator & Conversational Router
* **File Reference**: [`server/agentEngine.js`](file:///c:/Users/Jwalant/.gemini/antigravity/scratch/jasper-assistant/server/agentEngine.js)
* **Responsibilities**:
  1. **Intent Classification & Dispatch**: Analyzes incoming natural language commands using keyword/regex routing for ultra-low latency local actions, falling back to neural LLM reasoning for ambiguous directives.
  2. **Multi-Turn Context Management**: Maintains conversational memory threads. When a user asks:
     * *User*: "How much did I spend this month?" → *JASPER*: "You have spent ₹132.49 this month."
     * *User*: "What about last month?" → *JASPER* recognizes that "last month" refers to historical spending in the Financial domain, passing `timeframe: 'last_month'` to the Finance Agent.
  3. **Streaming & Voice Interruption**: Supports immediate cancellation tokens when user utters "Stop", "Cancel", or "Wait".

### 2.2 Autonomous Internal Agent Swarm
* **File Reference**: [`server/swarmEngine.js`](file:///c:/Users/Jwalant/.gemini/antigravity/scratch/jasper-assistant/server/swarmEngine.js)
The Core Orchestrator delegates tasks to 12 dedicated domain agents:
1. **Finance Agent**: Oversees Pay Vault, transaction categorization, cash flow analysis, What-If simulations, and Guardian Budget Sentinel limits.
2. **Telephony & Call Agent**: Detects incoming calls via ADB / carrier trunks, runs real-time speech-to-text screening, extracts intent, and briefs the user.
3. **Communications Agent**: Monitors WhatsApp threads via `whatsapp-web.js`, drafts context-aware auto-replies, and filters emergency messages.
4. **Device & Hardware Agent**: Manages ADB Android links, Samsung Smart TV WebSocket APIs, JioFiber STB, PC volume, and display power.
5. **3D & Blender Agent**: Translates natural language geometry commands into executable Python `bpy` scripts executed headless by `blender.exe`.
6. **Video Production Agent**: Coordinates storyboard generation, procedural audio synthesis, caption synchronization, and client-side canvas rendering.
7. **Research & Web Agent**: Conducts autonomous web research via DuckDuckGo, extracts clean markdown from URLs, and cites verifiable sources.
8. **Coding & Shell Agent**: Interacts with the local file workspace, executes sandboxed Node.js / PowerShell snippets, and formats code diffs.
9. **Navigation & Spatial Agent**: Handles Leaflet map rendering, OpenStreetMap routing, geofenced reminders, and live public satellite telemetry.
10. **Security & Firewall Agent**: Audits network open ports, validates session tokens, enforces least-privilege tool execution, and inspects USB security keys.
11. **Planning & Task Agent**: Maintains calendar events, multi-step task plans, and automated scheduled routines.
12. **Memory Agent**: Indexes facts, user preferences, and financial constraints into 128D semantic vector space.

### 2.3 Hybrid Edge / Cloud Computing Engine
* **Cloud Primary**: Google Gemini Pro neural core (`geminiClient.js`) for complex cross-domain reasoning, video scripts, and nuanced conversational dialogue.
* **Edge Local**: Local Ollama instance (`http://localhost:11434` / Llama 3 / Mistral) via [`server/ollamaBridge.js`](file:///c:/Users/Jwalant/.gemini/antigravity/scratch/jasper-assistant/server/ollamaBridge.js) for private, zero-leakage local operations.
* **Telemetry States**: The system explicitly reports its operational mode:
  * `LOCAL`: Operating entirely on-device via Ollama (no cloud network egress).
  * `CLOUD`: Operating via authenticated Gemini neural API.
  * `HYBRID`: Local intent matching with cloud neural synthesis.
  * `OFFLINE`: Network disconnected; only deterministic tools and local memory active.

### 2.4 Device Ecosystem & Host Satellite Bridge
* **Local Subnet Discovery**: Discovers devices on `192.168.29.0/24`:
  * Samsung Smart TV (`192.168.29.229:8002` via WebSocket)
  * JioFiber STB (`192.168.29.230` via HTTP Remote)
  * Android Mobile (`192.168.29.159:42931` via Wireless ADB)
* **Host Laptop Satellite Relay**: When deployed to cloud environments (e.g., Render), local PC commands cannot reach home LAN hardware directly. [`satellite/satelliteAgent.js`](file:///c:/Users/Jwalant/.gemini/antigravity/scratch/jasper-assistant/satellite/satelliteAgent.js) establishes an authenticated WebSocket tunnel from the user's laptop to the cloud backend, relaying hardware tool directives to local physical devices seamlessly.

---

## 3. Data Flow Architecture

### 3.1 Directive Execution Lifecycle
1. **Intake**: Voice input (Web Speech API / whisper) or chat message ingested by client HUD.
2. **Context Resolution**: The Orchestrator queries `vectorMemory.searchMemory()` for relevant user profile constraints and retrieves active conversation history.
3. **Intent Delegation**: The Orchestrator maps query to one or more specialized tools / agents.
4. **Zero-Trust Permission Check**: `permissionLayer.checkPermission()` determines tool risk (L0 to L3). If L3, execution pauses and dispatches a confirmation modal to the UI.
5. **Execution**: The tool handler executes locally or relays to the Satellite Bridge.
6. **State Persistence**: Database records updated; audit event appended to `activity_log.json`.
7. **Response Synthesis**: Classy, concise JARVIS-styled speech generated via Web Audio / elevenlabs / Edge TTS, paired with HUD data card updates.

---

## 4. Database & Storage Architecture

* **Database Core**: [`server/database.js`](file:///c:/Users/Jwalant/.gemini/antigravity/scratch/jasper-assistant/server/database.js) persisting to `server/data/jasper.db.json`.
* **Semantic Vectors**: `server/data/semantic_memory.json` maintaining 128-dimensional dense embeddings with Okapi BM25 indices.
* **Audit Logs**: `server/data/activity_log.json` maintaining an immutable log of tool calls, permissions, and security events.
* **Permissions Config**: `server/data/agent_permissions.json` storing granular user overrides for individual system tools.
