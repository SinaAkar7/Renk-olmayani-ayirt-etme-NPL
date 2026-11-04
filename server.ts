/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Query Word2Vec model via Python helper script
async function queryWord2Vec(words: string[]): Promise<any> {
  return new Promise((resolve) => {
    const pythonScript = path.resolve(__dirname, 'server/lookup_vectors.py');
    const child = spawn('python3', [pythonScript, ...words]);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0 && stdoutData.trim()) {
        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
          return;
        } catch (err) {
          console.error('Word2Vec JSON parse error:', err);
        }
      } else {
        console.error('Word2Vec script error:', stderrData || `Exit code ${code}`);
      }
      resolve(null);
    });

    child.on('error', (err) => {
      console.error('Failed to spawn python Word2Vec script:', err);
      resolve(null);
    });
  });
}

// Helper: Query Gemini 3.8 Flash Large Language Model for color analysis
async function queryGeminiLLM(words: string[]): Promise<any> {
  const prompt = `Sen uzman bir Türkçe Dilbilimci ve Büyük Dil Modelisin (LLM).
Görevin, sana verilen 4 kelimeyi analiz ederek:
1) Bu kelimelerden hangilerinin Türkçe renk isimleri olduğunu tek tek tespit etmek.
2) Aralarındaki renk ismi OLMAYAN kelimeyi bulmak (aykırı / yabancı kelime).
3) Eğer renk ise Türkçe tonunu, kategorisini (örn: Ana Renk, Ara Renk, Geleneksel Türk Rengi, Pastel vb.) ve tahmini en uygun HEX renk kodunu vermek.
4) Renk değilse ne olduğunu (nesne, eylem/fiil, hayvan, yer, kavram vb.) ve neden renk olmadığını açıklamak.
5) Net, anlaşılır ve kesin bir sonuç hükmü (verdict) ve gerekçeli açıklama üretmek.

Analiz Edilecek 4 Kelime:
${words.map((w, idx) => `${idx + 1}. "${w}"`).join('\n')}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Türkçe dilinde kelime anlamı, anlambilim (semantik) ve renk kavramları konusunda derin uzmanlığa sahipsin. Her kelimeyi tarafsız, kesin ve ayrıntılı olarak analiz et.',
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wordsAnalysis: {
              type: Type.ARRAY,
              description: 'Girilen 4 kelimenin ayrıntılı analizi',
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: 'Analiz edilen kelime' },
                  isColor: {
                    type: Type.BOOLEAN,
                    description: 'Kelime bir renk ismi midir?',
                  },
                  category: {
                    type: Type.STRING,
                    description:
                      'Renk ise kategorisi (Ana Renk, Ara Renk, Geleneksel vb.) veya renk değilse türü (Araç, Fiil vb.)',
                  },
                  hexCode: {
                    type: Type.STRING,
                    description: 'Renk ise en uygun HEX renk kodu (örn: #FF0000), değilse boş string',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Kelimenin anlambilimsel açıklaması',
                  },
                },
                required: ['word', 'isColor', 'category', 'hexCode', 'explanation'],
              },
            },
            colorWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Renk ismi olan kelimelerin listesi',
            },
            nonColorWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Renk ismi olmayan kelimelerin listesi',
            },
            outlierWord: {
              type: Type.STRING,
              description: 'Aralarındaki renk ismi olmayan tek kelime (veya birden çoksa birincisi)',
            },
            verdict: {
              type: Type.STRING,
              description: 'Kullanıcıya yönelik net karar cümlesi (örn: Aralarında renk ismi olmayan: "araba")',
            },
            detailedReasoning: {
              type: Type.STRING,
              description: 'Neden bu kelimenin renk olmadığı ve diğerlerinin renk olduğuna dair kapsamlı Türkçe açıklama',
            },
          },
          required: [
            'wordsAnalysis',
            'colorWords',
            'nonColorWords',
            'outlierWord',
            'verdict',
            'detailedReasoning',
          ],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null;
  }
  return null;
}

// API Routes
app.post('/api/analyze', async (req, res) => {
  try {
    const rawWords = req.body.words;
    if (!Array.isArray(rawWords) || rawWords.length !== 4) {
      return res.status(400).json({
        error: 'Lütfen analiz için tam olarak 4 kelime gönderin.',
      });
    }

    const words = rawWords.map((w) =>
      String(w || '')
        .trim()
        .replace(/I/g, 'ı')
        .replace(/İ/g, 'i')
        .toLowerCase()
    );

    // Run Gemini LLM and Word2Vec in parallel
    const [llmResult, w2vResult] = await Promise.all([
      queryGeminiLLM(words),
      queryWord2Vec(words),
    ]);

    // Construct final enriched response
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      inputWords: words,
      llm: llmResult,
      word2vec: w2vResult,
      summary: {
        colors: llmResult?.colorWords || [],
        nonColors: llmResult?.nonColorWords || [],
        outlier: llmResult?.outlierWord || w2vResult?.w2vOutlier || null,
        verdict: llmResult?.verdict || `Aralarında renk ismi olmayan: "${w2vResult?.w2vOutlier}"`,
        explanation: llmResult?.detailedReasoning || '',
      },
    });
  } catch (err: any) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Analiz sırasında hata oluştu: ' + err.message });
  }
});

// Endpoint to download / get raw JSON
app.get('/api/dataset', (req, res) => {
  const jsonPath = path.resolve(__dirname, 'public/data/colors_tr.json');
  if (fs.existsSync(jsonPath)) {
    res.sendFile(jsonPath);
  } else {
    res.status(404).json({ error: 'Dataset not found' });
  }
});

// Serve standalone static HTML
app.get('/standalone', (req, res) => {
  const staticHtml = path.resolve(__dirname, 'public/standalone.html');
  if (fs.existsSync(staticHtml)) {
    res.sendFile(staticHtml);
  } else {
    res.status(404).send('Standalone file not found');
  }
});

// Serve separate files static app
app.use('/static-app', express.static(path.resolve(__dirname, 'static-app')));

// Serve Vite in development or static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
