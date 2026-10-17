/**
 * J.A.S.P.E.R. Universal Knowledge & Task Fulfillment Engine
 * 
 * Provides resilient, zero-config, comprehensive intelligence to:
 * 1. Answer ANY question asked (science, history, philosophy, geography, culture, trivia, concepts).
 * 2. Execute or guide ANY task given (calculations, coding, drafting emails, study schedules, recipes).
 * 3. Gracefully integrate Google Gemini 2.0 Flash cloud reasoning when an API key is available.
 */

const https = require('https');

class KnowledgeEngine {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  setApiKey(key) {
    if (key && typeof key === 'string') {
      this.geminiApiKey = key.trim();
    }
  }

  getApiKey() {
    return this.geminiApiKey;
  }

  hasValidGeminiKey() {
    return Boolean(this.geminiApiKey && typeof this.geminiApiKey === 'string' && this.geminiApiKey.trim().length >= 20 && !/\s/.test(this.geminiApiKey.trim()));
  }

  /**
   * Main entrypoint: Resolves ANY natural-language question or task directive.
   */
  async resolveUniversalQuery(query, options = {}) {
    if (!query || typeof query !== 'string') return null;
    const raw = query.trim();
    const lower = raw.toLowerCase();
    const userName = options.userName || 'Sir';

    // ── Tier 0: Direct Gemini Cloud execution if valid key is registered ──
    const activeKey = options.apiKey || this.geminiApiKey;
    if (activeKey && typeof activeKey === 'string' && activeKey.trim().length >= 20 && !/\s/.test(activeKey.trim())) {
      try {
        const geminiResult = await this.queryGeminiCloud(raw, activeKey, options);
        if (geminiResult && geminiResult.trim()) {
          return geminiResult.trim();
        }
      } catch (err) {
        console.warn('[KnowledgeEngine] Gemini cloud call failed, failing over to local reasoning:', err.message);
      }
    }

    // ── Tier 1: Mathematical Calculation & Expressions ──
    const mathResult = this.evaluateCalculation(raw);
    if (mathResult) {
      return mathResult;
    }

    // ── Tier 2: Unit & Currency Conversions ──
    const convResult = this.evaluateConversion(raw);
    if (convResult) {
      return convResult;
    }

    // ── Tier 3: Writing, Drafting & Coding Task Generation ──
    const taskResult = this.generateTaskSolution(raw);
    if (taskResult) {
      return taskResult;
    }

    // ── Tier 4: Factual & Encyclopedic Q&A (Wikipedia REST Intelligence) ──
    const wikiResult = await this.queryWikipedia(raw);
    if (wikiResult && wikiResult.trim()) {
      return wikiResult.trim();
    }

    // ── Tier 5: Live Web Search via DuckDuckGo ──
    const webResult = await this.searchDuckDuckGo(raw);
    if (webResult && webResult.trim()) {
      return webResult.trim();
    }

    // ── Tier 6: High-Quality Intelligent Fallback ──
    return `I have analyzed your directive regarding "${raw}", ${userName}. All core subroutines stand ready to assist. For deep neural generative reasoning, you may also activate Gemini 2.0 Cloud by pasting a free API key from Google AI Studio directly here in chat.`;
  }

  /**
   * Call Google Gemini Cloud API with resilient model fallback
   */
  async queryGeminiCloud(prompt, apiKey, options = {}) {
    const systemPrompt = `You are J.A.S.P.E.R. (Just Another Super Personal Assistant), an ultra-intelligent, eloquent, sophisticated British AI assistant created for Sir Jwalant.
Answer with highest competence, depth, polish, and clarity. Format responses with clean GitHub-flavored markdown, bullet points, and code blocks where appropriate.`;

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];
    let lastError = null;

    for (const model of models) {
      try {
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)
        });

        if (res.ok) {
          const data = await res.json();
          const candidate = data?.candidates?.[0];
          const textPart = candidate?.content?.parts?.[0]?.text;
          if (textPart && textPart.trim()) {
            return textPart.trim();
          }
        } else {
          const errBody = await res.text();
          lastError = new Error(`Gemini ${model} status ${res.status}: ${errBody.substring(0, 80)}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini Cloud models failed to respond');
  }

  /**
   * Safe Mathematical & Computational Evaluation
   */
  evaluateCalculation(raw) {
    const cleaned = raw.toLowerCase()
      .replace(/^(what is|what's|calculate|solve|evaluate|compute)\s+/i, '')
      .replace(/[?.,!]+$/, '')
      .trim();

    // Check for square root
    const sqrtMatch = cleaned.match(/^(?:square root of|sqrt)\s*(\d+(?:\.\d+)?)$/i);
    if (sqrtMatch) {
      const num = parseFloat(sqrtMatch[1]);
      const res = Math.sqrt(num);
      return `Square root computation, Sir: √${num} = **${res}**.`;
    }

    // Check for percentage (e.g., "18% of 2500" or "what is 20 percent of 150")
    const percentMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)\s*(\d+(?:\.\d+)?)$/i);
    if (percentMatch) {
      const pct = parseFloat(percentMatch[1]);
      const base = parseFloat(percentMatch[2]);
      const val = (pct / 100) * base;
      return `Percentage calculation, Sir: **${pct}% of ${base} = ${val}**.`;
    }

    // Check for expressions with sqrt and arithmetic (e.g., "sqrt(256) + 40", "sqrt(144) * 2")
    const withSqrt = cleaned.replace(/sqrt\s*\(([^)]+)\)/gi, (m, p) => `Math.sqrt(${p})`);
    const testPattern = cleaned.replace(/sqrt\s*\([^)]+\)/gi, '1');
    if (/^[0-9\s+\-*/().*^%]+$/.test(testPattern) && /\d/.test(testPattern) && /[+\-*/^%]/.test(testPattern)) {
      try {
        const sanitized = withSqrt.replace(/\^/g, '**').replace(/%/g, '/100');
        if (/^[0-9\s+\-*/().*Math.sqrt]+$/.test(sanitized)) {
          const val = (new Function(`"use strict"; return (${sanitized});`))();
          if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
            return `Calculation complete, Sir: **${cleaned} = ${val}**.`;
          }
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Unit & Currency Conversions
   */
  evaluateConversion(raw) {
    const lower = raw.toLowerCase().replace(/^(convert|what is|how much is)\s+/i, '').replace(/[?.,!]+$/, '').trim();

    // Currency USD to INR (approx baseline: 86.5)
    const usdToInr = lower.match(/^(\d+(?:\.\d+)?)\s*(?:usd|dollars?|\$)\s*(?:to|in)\s*(?:inr|rupees?|rs\.?|₹)/i);
    if (usdToInr) {
      const amt = parseFloat(usdToInr[1]);
      const inr = Math.round(amt * 86.5 * 100) / 100;
      return `Currency telemetry: **$${amt} USD** is approximately **₹${inr.toLocaleString('en-IN')} INR** (at ~86.5 INR/USD).`;
    }

    // Currency INR to USD
    const inrToUsd = lower.match(/^(\d+(?:\.\d+)?)\s*(?:inr|rupees?|rs\.?|₹)\s*(?:to|in)\s*(?:usd|dollars?|\$)/i);
    if (inrToUsd) {
      const amt = parseFloat(inrToUsd[1]);
      const usd = (amt / 86.5).toFixed(2);
      return `Currency telemetry: **₹${amt.toLocaleString('en-IN')} INR** is approximately **$${usd} USD** (at ~86.5 INR/USD).`;
    }

    // Miles to Kilometers (1 mile = 1.60934 km)
    const miToKm = lower.match(/^(\d+(?:\.\d+)?)\s*(?:miles?|mi)\s*(?:to|in)\s*(?:kilometers?|km)/i);
    if (miToKm) {
      const val = parseFloat(miToKm[1]);
      const res = (val * 1.60934).toFixed(2);
      return `Distance conversion: **${val} miles** = **${res} km**, Sir.`;
    }

    // Kilometers to Miles
    const kmToMi = lower.match(/^(\d+(?:\.\d+)?)\s*(?:kilometers?|km)\s*(?:to|in)\s*(?:miles?|mi)/i);
    if (kmToMi) {
      const val = parseFloat(kmToMi[1]);
      const res = (val / 1.60934).toFixed(2);
      return `Distance conversion: **${val} km** = **${res} miles**, Sir.`;
    }

    // Celsius to Fahrenheit
    const cToF = lower.match(/^(\d+(?:\.\d+)?)\s*(?:c|celsius)\s*(?:to|in)\s*(?:f|fahrenheit)/i);
    if (cToF) {
      const val = parseFloat(cToF[1]);
      const res = ((val * 9/5) + 32).toFixed(1);
      return `Thermal conversion: **${val}°C** = **${res}°F**, Sir.`;
    }

    // Fahrenheit to Celsius
    const fToC = lower.match(/^(\d+(?:\.\d+)?)\s*(?:f|fahrenheit)\s*(?:to|in)\s*(?:c|celsius)/i);
    if (fToC) {
      const val = parseFloat(fToC[1]);
      const res = (((val - 32) * 5/9)).toFixed(1);
      return `Thermal conversion: **${val}°F** = **${res}°C**, Sir.`;
    }

    return null;
  }

  /**
   * Intelligent Task Solutions (Emails, Coding, Timetables, Routines)
   */
  generateTaskSolution(raw) {
    const lower = raw.toLowerCase().trim();

    // ── Rescheduling Meeting / Appointment ──
    if (lower.match(/\b(reschedule|postpone|move|rescheduling)\b.*\b(meeting|call|sync|discussion|chat|appointment)\b/)) {
      const personMatch = raw.match(/\b(?:with|for)\s+([A-Z][a-z]+|\b[a-z]+\b)/i);
      const recipient = personMatch ? personMatch[1] : '[Recipient Name]';

      return `Certainly, Sir. Here is a courteous, professional email to reschedule your meeting:

---
**Subject:** Rescheduling Request: Our Upcoming Sync — [Your Name]

Dear ${recipient},

I hope this message finds you well.

Due to an unexpected scheduling conflict that has arisen, I regret that I will need to request rescheduling our upcoming meeting previously set for [Original Date & Time].

I apologize for any disruption to your calendar. Would any of the following alternatives work for you?
- **Option 1:** Tomorrow at [Alternative Time 1]
- **Option 2:** [Day of Week] at [Alternative Time 2]

Please let me know if either of those suits your availability, or feel free to suggest a time that works better for you.

Thank you very much for your understanding and flexibility.

Best regards,  
**Jwalant**  
---`;
    }

    // ── Sick Leave / Leave Application ──
    if (lower.match(/\b(sick leave|leave application|leave request|time off|vacation leave)\b/)) {
      return `Certainly, Sir. Here is a formal, polished leave application ready for your dispatch:

---
**Subject:** Leave Application — Jwalant — [Dates]

Dear [Manager/Supervisor Name],

I am writing to formally request leave of absence from [Start Date] to [End Date] due to health reasons / medical rest. 

I have ensured that all my immediate responsibilities are updated, and [Colleague Name] has kindly agreed to cover urgent operational items during my absence. I will monitor critical communications as health permits and resume full duties on [Return Date].

Thank you for your understanding.

Warm regards,  
**Jwalant**  
[Contact Information]  
---`;
    }

    // ── Resignation Letter ──
    if (lower.match(/\b(resignation letter|resignation)\b/)) {
      return `Understood, Sir. Here is a courteous and professional resignation letter:

---
**Subject:** Resignation — Jwalant

Dear [Manager Name],

Please accept this letter as formal notification that I am resigning from my position as [Your Role] at [Company Name]. My last day of service will be [Last Working Date], in accordance with my notice period.

I am immensely grateful for the opportunities, mentorship, and professional growth I have experienced during my tenure here. I appreciate the camaraderie of the team and will look back fondly on our achievements together.

During my remaining time, I will actively assist in transferring all ongoing projects, documenting key processes, and ensuring a seamless transition. 

I wish the team and company continued success in the future.

Sincerely,  
**Jwalant**  
---`;
    }

    // ── General Email / Note Drafting ──
    if (lower.match(/^(draft|write|compose|generate)\s+(an?\s+)?(email|letter|message|note)\b/)) {
      const topic = raw.replace(/^(draft|write|compose|generate)\s+(an?\s+)?(email|letter|message|note)\s*(about|for|regarding|to)?/i, '').trim();
      return `Here is a polished, professional draft prepared for you, Sir:

---
**Subject:** Regarding: ${topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : 'Update and Overview'}

Dear [Recipient Name],

I hope you are having a productive week.

I am writing to connect with you regarding ${topic || 'our upcoming milestones'}. [Key point or update here].

Please let me know your thoughts or availability to discuss this further. I look forward to hearing from you.

Kind regards,  
**Jwalant**  
---`;
    }

    // ── Daily Schedule & Productivity Optimization ──
    if (lower.match(/\b(organize|plan|schedule|routine)\b.*\b(day|daily|study|productivity|workout)\b/)) {
      return `Here is an optimized high-efficiency daily routine structured for peak cognitive performance, Sir:

### ⚡ J.A.S.P.E.R. High-Performance Schedule

| Time Block | Phase | Objective |
| :--- | :--- | :--- |
| **06:30 – 07:30** | *Activation* | Hydration, physical workout, and brief morning meditation |
| **07:30 – 08:30** | *Briefing & Fuel* | Nutritious breakfast and J.A.S.P.E.R. Morning Briefing review |
| **08:30 – 11:30** | *Deep Work Block I* | Highest-priority cognitive tasks (coding, strategic planning, writing) |
| **11:30 – 12:30** | *Administrative* | Communications, emails, and sync calls |
| **12:30 – 13:30** | *Recharge* | Balanced lunch and screen-free mental pause |
| **13:30 – 16:30** | *Deep Work Block II* | Implementation, project building, collaborative execution |
| **16:30 – 17:30** | *Wrap-Up & Review* | Task logging, daily retrospectives, planning tomorrow's objectives |
| **18:00 – 21:00** | *Personal & Leisure* | Family time, hobbies, reading, and relaxation |
| **22:00 – 22:30** | *Shutdown Sequence* | Digital screens off; preparation for 7–8 hours restorative sleep |

Standing by if you would like me to set automated reminder chimes for these intervals, Sir.`;
    }

    // ── Code Generation: Fibonacci ──
    if (lower.match(/\b(fibonacci|fibonacci sequence|fibonacci series)\b/)) {
      return `Here is an optimized Python implementation for calculating Fibonacci numbers:

\`\`\`python
# 1. Fast Iterative Approach — O(N) Time, O(1) Space
def fibonacci(n: int) -> int:
    """Returns the nth Fibonacci number (0-indexed)."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# 2. Generator to stream the first N numbers
def fibonacci_series(limit: int):
    a, b = 0, 1
    for _ in range(limit):
        yield a
        a, b = b, a + b

# Demonstration:
print("10th Fibonacci number:", fibonacci(10))  # 55
print("First 10 Fibonacci numbers:", list(fibonacci_series(10)))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\``;
    }

    // ── Code Generation: Binary Search ──
    if (lower.match(/\b(binary search|bsearch)\b/)) {
      return `Here is the standard, optimal Binary Search implementation in Python:

\`\`\`python
def binary_search(arr: list, target) -> int:
    """
    Performs binary search on a sorted list.
    Returns the index if target is found, or -1 otherwise.
    Time Complexity: O(log N) | Space Complexity: O(1)
    """
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        guess = arr[mid]

        if guess == target:
            return mid
        elif guess < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1

# Demonstration:
sample_list = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print("Index of 23:", binary_search(sample_list, 23))  # 5
print("Index of 100:", binary_search(sample_list, 100)) # -1
\`\`\``;
    }

    // ── Code Generation: Palindrome ──
    if (lower.match(/\b(palindrome|check palindrome)\b/)) {
      return `Here is an optimal, clean Python solution to check for palindromes, Sir:

\`\`\`python
def is_palindrome(text: str) -> bool:
    """
    Checks if a string is a palindrome, ignoring casing,
    whitespace, and non-alphanumeric punctuation.
    """
    # Normalize by keeping only alphanumeric characters in lowercase
    cleaned = ''.join(char.lower() for char in text if char.isalnum())
    # A palindrome reads identically forwards and backwards
    return cleaned == cleaned[::-1]

# Demonstrations:
print(is_palindrome("A man, a plan, a canal: Panama"))  # True
print(is_palindrome("race a car"))                      # False
print(is_palindrome("Madam, in Eden, I'm Adam"))       # True
\`\`\`

Time Complexity: **O(N)** | Space Complexity: **O(N)**. Ready for execution in your Python environment.`;
    }

    // ── Code Generation: Web Scraper ──
    if (lower.match(/\b(scrape|web scraper|scraping)\b.*\b(news|headlines|python)\b/)) {
      return `Here is a lightweight, reliable Python web scraper utilizing \`requests\` and \`BeautifulSoup\`, Sir:

\`\`\`python
import requests
from bs4 import BeautifulSoup

def fetch_top_headlines():
    url = "https://news.ycombinator.com"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        titles = soup.find_all("span", class_="titleline")
        
        print(f"--- Top Headlines from {url} ---")
        for idx, item in enumerate(titles[:10], start=1):
            link_tag = item.find("a")
            if link_tag:
                title = link_tag.get_text()
                href = link_tag.get("href")
                print(f"[{idx}] {title}")
                print(f"    URL: {href}")
                
    except Exception as error:
        print(f"Scraper error encountered: {error}")

if __name__ == "__main__":
    fetch_top_headlines()
\`\`\`

To run this on your machine:
\`\`\`bash
pip install requests beautifulsoup4
python scraper.py
\`\`\``;
    }

    // ── Code Generation: Reverse String / Array ──
    if (lower.match(/\b(reverse)\b.*\b(string|array|list|words)\b/)) {
      return `Here are clean Python examples for reversing strings and lists, Sir:

\`\`\`python
# 1. Reverse a string
text = "JASPER Assistant"
reversed_text = text[::-1]
print("Reversed string:", reversed_text)  # "tnatsissA REPSAJ"

# 2. Reverse word by word
sentence = "The future of ambient intelligence"
reversed_words = ' '.join(sentence.split()[::-1])
print("Reversed words:", reversed_words)  # "intelligence ambient of future The"

# 3. In-place list reverse
items = [1, 2, 3, 4, 5]
items.reverse()
print("Reversed list:", items)            # [5, 4, 3, 2, 1]
\`\`\``;
    }

    return null;
  }

  /**
   * Factual Knowledge via Wikipedia REST API
   */
  async queryWikipedia(query) {
    // Skip if query is an imperative drafting or creation request
    if (query.match(/\b(write|draft|compose|create|make|code|generate|remind|schedule|book|call)\b/i)) {
      return null;
    }

    // Strip conversational lead-ins to identify core topic
    const cleaned = query
      .replace(/^(who was|who is|who were|what was|what is|what are|tell me about|explain|describe|define|history of|where is|how does|how do|can you explain)\s+/i, '')
      .replace(/[?.,!]+$/, '')
      .trim();

    if (!cleaned || cleaned.length < 2) return null;

    try {
      // 1. Search Wikipedia for best matching article
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleaned)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'JasperPersonalAssistant/1.0 (contact@jasper.ai)' },
        signal: AbortSignal.timeout(6000)
      });

      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      const hits = searchData?.query?.search || [];
      if (hits.length === 0) return null;

      // Ensure top hit is relevant to the topic
      const searchKeywords = cleaned.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let topHit = hits.find(hit => {
        const titleLower = hit.title.toLowerCase();
        return searchKeywords.some(kw => titleLower.includes(kw));
      }) || hits[0];

      // 2. Fetch summary of top page
      const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHit.title)}`;
      const pageRes = await fetch(pageUrl, {
        headers: { 'User-Agent': 'JasperPersonalAssistant/1.0 (contact@jasper.ai)' },
        signal: AbortSignal.timeout(6000)
      });

      if (!pageRes.ok) return null;
      const pageData = await pageRes.json();

      if (pageData.extract && pageData.extract.length > 30) {
        let answer = `According to J.A.S.P.E.R. knowledge archives on **${pageData.title}**:\n\n${pageData.extract}`;
        if (pageData.description) {
          answer += `\n\n*${pageData.description}*`;
        }
        return answer;
      }
    } catch (err) {
      console.warn('[KnowledgeEngine] Wikipedia query error:', err.message);
    }

    return null;
  }

  /**
   * Live Web Search via DuckDuckGo
   */
  async searchDuckDuckGo(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'JasperPersonalAssistant/1.0' },
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) return null;
      const data = await res.json();

      if (data.AbstractText) {
        return `Intelligence summary for **${data.Heading || query}**, Sir:\n\n${data.AbstractText}\n\n*(Source: ${data.AbstractSource || 'Web Index'})*`;
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const top = data.RelatedTopics.find(t => t.Text && !t.Topics);
        if (top && top.Text) {
          return `Intelligence lookup for "${query}", Sir:\n\n${top.Text}`;
        }
      }
    } catch (err) {
      console.warn('[KnowledgeEngine] DuckDuckGo search error:', err.message);
    }

    return null;
  }
}

module.exports = new KnowledgeEngine();
