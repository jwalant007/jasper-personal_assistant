const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'data');
const SEMANTIC_STORE_PATH = path.join(MEMORY_DIR, 'semantic_memory.json');

if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// Stop words list for cleaning text tokens
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now'
]);

/**
 * Tokenize and normalize text into clean lowercased terms.
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Calculate Term Frequency (TF) for a document.
 */
function computeTF(tokens) {
  const tf = {};
  if (tokens.length === 0) return tf;
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  for (const token in tf) {
    tf[token] = tf[token] / tokens.length;
  }
  return tf;
}

/**
 * Calculate Cosine Similarity between two term frequency vectors.
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const term in vecA) {
    normA += vecA[term] * vecA[term];
    if (vecB[term]) {
      dotProduct += vecA[term] * vecB[term];
    }
  }

  for (const term in vecB) {
    normB += vecB[term] * vecB[term];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class VectorMemoryEngine {
  constructor() {
    this.memories = [];
    this.loadStore();
  }

  loadStore() {
    try {
      if (fs.existsSync(SEMANTIC_STORE_PATH)) {
        const raw = fs.readFileSync(SEMANTIC_STORE_PATH, 'utf-8');
        this.memories = JSON.parse(raw);
      } else {
        // Initialize default baseline memories
        this.memories = [
          {
            id: 1,
            text: 'User prefers concise audio responses',
            category: 'preference',
            date: new Date().toISOString(),
            tokens: tokenize('User prefers concise audio responses')
          },
          {
            id: 2,
            text: 'Default smart home TV is Samsung Frame in Living Room',
            category: 'device',
            date: new Date().toISOString(),
            tokens: tokenize('Default smart home TV is Samsung Frame in Living Room')
          },
          {
            id: 3,
            text: 'User name is Jwalant',
            category: 'profile',
            date: new Date().toISOString(),
            tokens: tokenize('User name is Jwalant')
          }
        ];
        this.saveStore();
      }
    } catch (e) {
      console.error('[VectorMemory] Error loading store:', e.message);
      this.memories = [];
    }
  }

  saveStore() {
    try {
      fs.writeFileSync(SEMANTIC_STORE_PATH, JSON.stringify(this.memories, null, 2), 'utf-8');
    } catch (e) {
      console.error('[VectorMemory] Error saving store:', e.message);
    }
  }

  addMemory(text, category = 'general', metadata = {}) {
    if (!text || typeof text !== 'string') return null;

    // Check for existing duplicate memory to avoid bloat
    const existingIndex = this.memories.findIndex(m => m.text.toLowerCase().trim() === text.toLowerCase().trim());
    if (existingIndex !== -1) {
      this.memories[existingIndex].date = new Date().toISOString();
      this.saveStore();
      return this.memories[existingIndex];
    }

    const newId = this.memories.length > 0 ? Math.max(...this.memories.map(m => m.id || 0)) + 1 : 1;
    const memoryObj = {
      id: newId,
      text: text.trim(),
      category,
      date: new Date().toISOString(),
      tokens: tokenize(text),
      metadata
    };

    this.memories.push(memoryObj);
    this.saveStore();
    return memoryObj;
  }

  deleteMemory(id) {
    const numId = parseInt(id, 10);
    this.memories = this.memories.filter(m => m.id !== numId);
    this.saveStore();
    return true;
  }

  /**
   * Search memory using semantic TF-IDF cosine similarity.
   */
  searchMemory(query, topK = 5) {
    if (!query || this.memories.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTF = computeTF(queryTokens);

    const scored = this.memories.map(mem => {
      const docTokens = mem.tokens || tokenize(mem.text);
      const docTF = computeTF(docTokens);
      const similarity = cosineSimilarity(queryTF, docTF);

      // Exact keyword overlap boost
      let overlapCount = 0;
      for (const qt of queryTokens) {
        if (docTokens.includes(qt)) overlapCount++;
      }
      const overlapBoost = (overlapCount / Math.max(queryTokens.length, 1)) * 0.3;

      const finalScore = Math.min(1.0, similarity + overlapBoost);

      return {
        ...mem,
        score: parseFloat(finalScore.toFixed(3))
      };
    });

    // Filter non-zero scores and sort descending by score
    return scored
      .filter(item => item.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Automatically extract key user facts/preferences from text conversation.
   */
  extractMemoriesFromText(text) {
    if (!text || typeof text !== 'string') return [];

    const extracted = [];

    // Fact extraction regex patterns
    const prefPatterns = [
      /my name is ([a-z\s]+)/i,
      /i prefer ([a-z0-9\s]+)/i,
      /i like ([a-z0-9\s]+)/i,
      /i love ([a-z0-9\s]+)/i,
      /remember that ([a-z0-9\s]+)/i,
      /my favorite ([a-z0-9\s]+) is ([a-z0-9\s]+)/i,
      /my ([a-z0-9\s]+) is ([a-z0-9\s]+)/i
    ];

    for (const pattern of prefPatterns) {
      const match = text.match(pattern);
      if (match) {
        const fact = match[0].trim();
        if (fact.length > 5 && fact.length < 150) {
          const added = this.addMemory(fact, 'auto-extracted', { source: 'conversation' });
          if (added) extracted.push(added);
        }
      }
    }

    return extracted;
  }

  getAllMemories() {
    return this.memories;
  }
}

module.exports = new VectorMemoryEngine();
