const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'data');
const SEMANTIC_STORE_PATH = path.join(MEMORY_DIR, 'semantic_memory.json');

if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now'
]);

// Domain-specific synonym graph for smart home, personal assistant, and IoT
const SYNONYM_MAP = {
  'tv': ['television', 'screen', 'display', 'monitor'],
  'television': ['tv', 'screen', 'display'],
  'car': ['automobile', 'vehicle', 'auto', 'ride'],
  'automobile': ['car', 'vehicle', 'auto'],
  'vehicle': ['car', 'automobile'],
  'phone': ['mobile', 'smartphone', 'cellphone', 'cell'],
  'mobile': ['phone', 'smartphone', 'cell'],
  'smartphone': ['phone', 'mobile'],
  'pc': ['computer', 'laptop', 'workstation', 'desktop'],
  'computer': ['pc', 'laptop', 'desktop'],
  'laptop': ['pc', 'computer'],
  'lights': ['light', 'lamp', 'lighting', 'illumination', 'bulb'],
  'light': ['lights', 'lamp', 'lighting'],
  'music': ['audio', 'song', 'sound', 'track', 'melody'],
  'audio': ['sound', 'music', 'volume', 'acoustic'],
  'sound': ['audio', 'music', 'volume'],
  'living': ['living room', 'lounge', 'hall'],
  'lounge': ['living room', 'hall'],
  'hall': ['living room', 'lounge'],
  'temperature': ['temp', 'climate', 'heat', 'cooling', 'ac'],
  'ac': ['air conditioner', 'cooling', 'climate', 'temperature'],
  'name': ['identity', 'user', 'called'],
  'preference': ['prefer', 'likes', 'favorite', 'loves'],
  'prefer': ['preference', 'likes', 'favorite']
};

/**
 * 32-bit FNV-1a Hash for deterministic subword embedding projection
 */
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

const VECTOR_DIMS = 128;

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
 * Generate subword character n-grams (3-grams and 4-grams) for a token.
 */
function generateSubwords(token) {
  const subwords = [];
  const bounded = `<${token}>`;
  for (let n = 3; n <= 4; n++) {
    for (let i = 0; i <= bounded.length - n; i++) {
      subwords.push(bounded.substring(i, i + n));
    }
  }
  return subwords;
}

/**
 * Project text into a 128-dimensional dense semantic vector space.
 * Uses subword n-grams, word unigrams, and synonym expansion with L2 normalization.
 */
function computeLocalDenseEmbedding(text) {
  const vec = new Float32Array(VECTOR_DIMS);
  const tokens = tokenize(text);
  if (tokens.length === 0) return Array.from(vec);

  const addTermToVector = (term, weight) => {
    // 1. Project whole token
    const h1 = fnv1a(term);
    const idx1 = h1 % VECTOR_DIMS;
    const sign1 = (h1 & 0x10000) ? 1 : -1;
    vec[idx1] += sign1 * weight * 2.0;

    // 2. Project subwords (captures morphological stems, typos, prefixes/suffixes)
    const subwords = generateSubwords(term);
    for (const sw of subwords) {
      const h2 = fnv1a(sw);
      const idx2 = h2 % VECTOR_DIMS;
      const sign2 = (h2 & 0x10000) ? 1 : -1;
      vec[idx2] += sign2 * weight * (0.8 / Math.max(1, subwords.length));
    }
  };

  for (const token of tokens) {
    addTermToVector(token, 1.0);

    // Synonym expansion
    if (SYNONYM_MAP[token]) {
      for (const syn of SYNONYM_MAP[token]) {
        addTermToVector(syn, 0.65);
      }
    }
  }

  // L2 unit normalization
  let normSq = 0;
  for (let i = 0; i < VECTOR_DIMS; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq) || 1.0;
  for (let i = 0; i < VECTOR_DIMS; i++) {
    vec[i] /= norm;
  }

  return Array.from(vec);
}

/**
 * Cosine similarity between two float vectors.
 */
function vectorCosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1.0, dot));
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
        let updated = false;

        // Ensure every memory has pre-computed local dense embedding
        for (const mem of this.memories) {
          if (!mem.vector || mem.vector.length !== VECTOR_DIMS) {
            mem.vector = computeLocalDenseEmbedding(mem.text);
            mem.tokens = tokenize(mem.text);
            updated = true;
          }
        }
        if (updated) this.saveStore();
      } else {
        // Initialize default baseline memories with precomputed vectors
        const baseline = [
          {
            id: 1,
            text: 'User prefers concise audio responses',
            category: 'preference',
            date: new Date().toISOString()
          },
          {
            id: 2,
            text: 'Default smart home TV is Samsung Frame in Living Room',
            category: 'device',
            date: new Date().toISOString()
          },
          {
            id: 3,
            text: 'User name is Jwalant',
            category: 'profile',
            date: new Date().toISOString()
          }
        ];

        this.memories = baseline.map(m => ({
          ...m,
          tokens: tokenize(m.text),
          vector: computeLocalDenseEmbedding(m.text)
        }));

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
    const cleanText = text.trim();

    // Check for existing duplicate memory to avoid bloat
    const existingIndex = this.memories.findIndex(m => m.text.toLowerCase().trim() === cleanText.toLowerCase());
    if (existingIndex !== -1) {
      this.memories[existingIndex].date = new Date().toISOString();
      this.memories[existingIndex].vector = computeLocalDenseEmbedding(cleanText);
      this.memories[existingIndex].tokens = tokenize(cleanText);
      this.saveStore();
      return this.memories[existingIndex];
    }

    const newId = this.memories.length > 0 ? Math.max(...this.memories.map(m => m.id || 0)) + 1 : 1;
    const memoryObj = {
      id: newId,
      text: cleanText,
      category,
      date: new Date().toISOString(),
      tokens: tokenize(cleanText),
      vector: computeLocalDenseEmbedding(cleanText),
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
   * Search memory using a hybrid retrieval engine:
   * 1. 128D Dense Semantic Vector Cosine Similarity (subwords + synonyms)
   * 2. Okapi BM25 Ranking (IDF + term frequencies + doc length normalization)
   * 3. Exact term overlap bonus
   */
  searchMemory(query, topK = 5) {
    if (!query || this.memories.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryVec = computeLocalDenseEmbedding(query);

    // Expand query tokens with synonyms for BM25
    const expandedQueryTokens = new Set(queryTokens);
    for (const qt of queryTokens) {
      if (SYNONYM_MAP[qt]) {
        for (const syn of SYNONYM_MAP[qt]) {
          expandedQueryTokens.add(syn);
        }
      }
    }

    // Compute BM25 parameters across corpus
    const N = this.memories.length;
    let totalDocLen = 0;
    const docTermFreqs = [];

    for (let i = 0; i < N; i++) {
      const docTokens = this.memories[i].tokens || tokenize(this.memories[i].text);
      totalDocLen += docTokens.length;
      const tfMap = {};
      for (const t of docTokens) {
        tfMap[t] = (tfMap[t] || 0) + 1;
      }
      docTermFreqs.push({ len: docTokens.length, tf: tfMap, tokens: docTokens });
    }

    const avgdl = Math.max(1, totalDocLen / Math.max(1, N));
    const k1 = 1.2;
    const b = 0.75;

    // Document frequencies (DF) for query tokens
    const dfMap = {};
    for (const term of expandedQueryTokens) {
      let df = 0;
      for (let i = 0; i < N; i++) {
        if (docTermFreqs[i].tf[term]) df++;
      }
      dfMap[term] = df;
    }

    // Score documents
    const scored = this.memories.map((mem, idx) => {
      // 1. Dense vector cosine similarity
      const docVec = mem.vector || computeLocalDenseEmbedding(mem.text);
      const denseSim = vectorCosineSimilarity(queryVec, docVec);

      // 2. Okapi BM25 score
      const { len, tf, tokens } = docTermFreqs[idx];
      let bm25Score = 0;

      for (const term of expandedQueryTokens) {
        const f = tf[term] || 0;
        if (f > 0) {
          const df = dfMap[term] || 1;
          const idf = Math.log(((N - df + 0.5) / (df + 0.5)) + 1);
          const numerator = f * (k1 + 1);
          const denominator = f + k1 * (1 - b + b * (len / avgdl));
          bm25Score += idf * (numerator / denominator);
        }
      }

      // Normalize BM25 score into [0, 1] range
      const normalizedBM25 = Math.min(1.0, bm25Score / 4.0);

      // 3. Exact term overlap
      let overlapCount = 0;
      for (const qt of queryTokens) {
        if (tokens.includes(qt)) overlapCount++;
      }
      const overlapBoost = (overlapCount / Math.max(1, queryTokens.length)) * 0.2;

      // Hybrid composite score: 55% dense vector, 35% BM25, 10% overlap
      const finalScore = Math.min(1.0, (0.55 * denseSim) + (0.35 * normalizedBM25) + overlapBoost);

      return {
        ...mem,
        score: parseFloat(finalScore.toFixed(3)),
        denseSim: parseFloat(denseSim.toFixed(3)),
        bm25: parseFloat(normalizedBM25.toFixed(3))
      };
    });

    // Filter weak matches and sort descending
    return scored
      .filter(item => item.score > 0.08)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Automatically extract key user facts and preferences from conversation text.
   */
  extractMemoriesFromText(text) {
    if (!text || typeof text !== 'string') return [];

    const extracted = [];

    const factPatterns = [
      { regex: /my name is ([a-z\s]+)/i, category: 'profile' },
      { regex: /call me ([a-z\s]+)/i, category: 'profile' },
      { regex: /i am ([a-z\s]+)/i, category: 'profile' },
      { regex: /i prefer ([a-z0-9\s]+)/i, category: 'preference' },
      { regex: /i like ([a-z0-9\s]+)/i, category: 'preference' },
      { regex: /i love ([a-z0-9\s]+)/i, category: 'preference' },
      { regex: /i hate ([a-z0-9\s]+)/i, category: 'preference' },
      { regex: /my favorite ([a-z0-9\s]+) is ([a-z0-9\s]+)/i, category: 'preference' },
      { regex: /remember that ([a-z0-9\s]+)/i, category: 'fact' },
      { regex: /keep in mind that ([a-z0-9\s]+)/i, category: 'fact' },
      { regex: /don'?t forget that ([a-z0-9\s]+)/i, category: 'fact' },
      { regex: /my ([a-z0-9\s]+) is ([a-z0-9\s]+)/i, category: 'general' }
    ];

    for (const { regex, category } of factPatterns) {
      const match = text.match(regex);
      if (match) {
        const fact = match[0].trim();
        if (fact.length > 5 && fact.length < 150) {
          const added = this.addMemory(fact, category, { source: 'conversation' });
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
