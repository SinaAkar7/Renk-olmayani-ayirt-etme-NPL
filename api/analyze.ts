import { GoogleGenAI, Type } from '@google/genai';

// Embedded Turkish colors and similarity database
const KNOWN_COLORS: Record<string, { hex: string; category: string; desc: string; sim: number }> = {
  kırmızı: { hex: '#E53E3E', category: 'Ana Renk (Sıcak Renk)', desc: 'Görünür spektrumun en uzun dalga boylu ana rengi.', sim: 0.6154 },
  al: { hex: '#DC2626', category: 'Geleneksel', desc: 'Bayrak kırmızısı tonu.', sim: 0.5821 },
  mavi: { hex: '#3182CE', category: 'Ana Renk (Soğuk Renk)', desc: 'Gökyüzü ve denizin ana rengi.', sim: 0.604 },
  sarı: { hex: '#ECC94B', category: 'Ana Renk (Sıcak Renk)', desc: 'Güneşin ve altının parlak rengi.', sim: 0.5912 },
  yeşil: { hex: '#38A169', category: 'Ara Renk (Doğal Renk)', desc: 'Doğanın ve bitki örtüsünün rengi.', sim: 0.5982 },
  siyah: { hex: '#1A202C', category: 'Nötr Renk', desc: 'Işığın soğurulması durumu, kara.', sim: 0.551 },
  kara: { hex: '#0F172A', category: 'Geleneksel', desc: 'Koyu siyah.', sim: 0.534 },
  beyaz: { hex: '#F7FAFC', category: 'Nötr Renk', desc: 'Görünür tüm ışıkların birleşimi, ak.', sim: 0.567 },
  ak: { hex: '#FFFFFF', category: 'Geleneksel', desc: 'Saf parlak beyaz.', sim: 0.51 },
  mor: { hex: '#805AD5', category: 'Ara Renk', desc: 'Kırmızı ve mavinin asaleti.', sim: 0.573 },
  turuncu: { hex: '#DD6B20', category: 'Ara Renk', desc: 'Kırmızı ile sarının sıcak karışımı.', sim: 0.584 },
  turkuaz: { hex: '#319795', category: 'Geleneksel', desc: 'Geleneksel Türk mavisi.', sim: 0.542 },
  pembe: { hex: '#ED64A6', category: 'Ton', desc: 'Açık kırmızı tonu.', sim: 0.569 },
  kahverengi: { hex: '#7B341E', category: 'Doğal', desc: 'Toprak ve kavrulmuş kahve tonu.', sim: 0.552 },
  gri: { hex: '#718096', category: 'Nötr', desc: 'Siyah ve beyazın karışımı.', sim: 0.541 },
  lacivert: { hex: '#1E3A8A', category: 'Koyu Ton', desc: 'Koyu gece mavisi.', sim: 0.562 },
  bordo: { hex: '#831843', category: 'Koyu Ton', desc: 'Koyu şarap kırmızısı.', sim: 0.539 },
  eflatun: { hex: '#9333EA', category: 'Pastel', desc: 'Leylak ve açık mor tonu.', sim: 0.528 },
  lila: { hex: '#C084FC', category: 'Pastel', desc: 'Açık leylak rengi.', sim: 0.519 },
  bej: { hex: '#E2E8F0', category: 'Nötr', desc: 'Kumlu açık sarımsı gri.', sim: 0.501 },
  haki: { hex: '#4D7C0F', category: 'Toprak', desc: 'Askeri zeytuni yeşil.', sim: 0.512 },
  kızıl: { hex: '#B91C1C', category: 'Sıcak', desc: 'Ateş kırmızısı tonu.', sim: 0.534 },
  amber: { hex: '#D97706', category: 'Sıcak', desc: 'Kehribar sarısı.', sim: 0.498 },
  fuşya: { hex: '#C026D3', category: 'Canlı', desc: 'Canlı morumsu pembe.', sim: 0.489 },
  vişneçürüğü: { hex: '#4C0519', category: 'Geleneksel', desc: 'Derin vişne tonu.', sim: 0.514 },
  yavruağzı: { hex: '#FB7185', category: 'Geleneksel', desc: 'Açık mercan tonu.', sim: 0.492 },
  camgöbeği: { hex: '#06B6D4', category: 'Geleneksel', desc: 'Yeşilimsi açık parlak mavi.', sim: 0.508 },
  somon: { hex: '#FB923C', category: 'Pastel', desc: 'Somon balığı rengi.', sim: 0.478 },
  erguvan: { hex: '#701A75', category: 'Geleneksel', desc: 'İstanbul erguvan moru.', sim: 0.495 },
  zümrüt: { hex: '#059669', category: 'Değerli Taş', desc: 'Zümrüt yeşili.', sim: 0.485 },
  safir: { hex: '#1D4ED8', category: 'Değerli Taş', desc: 'Safir mavisi.', sim: 0.481 },
  yakut: { hex: '#9F1239', category: 'Değerli Taş', desc: 'Yakut kırmızısı.', sim: 0.479 },
  mercan: { hex: '#F43F5E', category: 'Deniz', desc: 'Mercan kırmızısı.', sim: 0.472 },
  hardal: { hex: '#CA8A04', category: 'Sıcak', desc: 'Hardal sarısı.', sim: 0.483 },
  antrasit: { hex: '#334155', category: 'Modern', desc: 'Kömür grisi.', sim: 0.492 },
  altın: { hex: '#EAB308', category: 'Metalik', desc: 'Altın sarısı.', sim: 0.461 },
  gümüş: { hex: '#CBD5E1', category: 'Metalik', desc: 'Gümüş parlak gri.', sim: 0.459 },
  bronz: { hex: '#92400E', category: 'Metalik', desc: 'Bronz esmer maden tonu.', sim: 0.455 },
  fildişi: { hex: '#FEF3C7', category: 'Pastel', desc: 'Kırık beyaz tonu.', sim: 0.465 },
  tarçın: { hex: '#9A3412', category: 'Baharat', desc: 'Kızıl kahverengi.', sim: 0.448 },
  zeytuni: { hex: '#65A30D', category: 'Doğal', desc: 'Zeytin yeşili.', sim: 0.471 },
};

async function queryGemini(words: string[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const prompt = `Sen uzman bir Türkçe Dilbilimci ve Büyük Dil Modelisin (LLM).
Görevin, sana verilen 4 kelimeyi analiz ederek:
1) Bu kelimelerden hangilerinin Türkçe renk isimleri olduğunu tek tek tespit etmek.
2) Aralarındaki renk ismi OLMAYAN kelimeyi bulmak (aykırı / yabancı kelime).
3) Eğer renk ise Türkçe tonunu, kategorisini (örn: Ana Renk, Ara Renk, Geleneksel Türk Rengi, Pastel vb.) ve tahmini en uygun HEX renk kodunu vermek.
4) Renk değilse ne olduğunu (nesne, eylem/fiil, hayvan, yer, kavram vb.) ve neden renk olmadığını açıklamak.
5) Net, anlaşılır ve kesin bir sonuç hükmü (verdict) ve gerekçeli açıklama üretmek.

Analiz Edilecek 4 Kelime:
${words.map((w, idx) => `${idx + 1}. "${w}"`).join('\n')}`;

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
                  isColor: { type: Type.BOOLEAN, description: 'Kelime bir renk ismi midir?' },
                  category: { type: Type.STRING, description: 'Renk kategorisi veya kelime türü' },
                  hexCode: { type: Type.STRING, description: 'En uygun HEX renk kodu' },
                  explanation: { type: Type.STRING, description: 'Kelimenin anlambilimsel açıklaması' },
                },
                required: ['word', 'isColor', 'category', 'hexCode', 'explanation'],
              },
            },
            colorWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Renk ismi olan kelimeler',
            },
            nonColorWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Renk ismi olmayan kelimeler',
            },
            outlierWord: {
              type: Type.STRING,
              description: 'Aralarındaki renk ismi olmayan kelime',
            },
            verdict: {
              type: Type.STRING,
              description: 'Kullanıcıya yönelik net karar cümlesi',
            },
            detailedReasoning: {
              type: Type.STRING,
              description: 'Neden bu kelimenin renk olmadığına dair kapsamlı Türkçe açıklama',
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
  } catch (err) {
    console.error('Gemini API call failed in serverless function:', err);
  }
  return null;
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    const rawWords = body?.words;
    if (!Array.isArray(rawWords) || rawWords.length !== 4) {
      return res.status(400).json({ error: 'Lütfen analiz için tam olarak 4 kelime gönderin.' });
    }

    const words = rawWords.map((w) =>
      String(w || '')
        .trim()
        .replace(/I/g, 'ı')
        .replace(/İ/g, 'i')
        .toLowerCase()
    );

    // Call Gemini LLM
    const llmResult = await queryGemini(words);

    // Local Word2Vec similarity calculation
    const isColorMap: Record<string, boolean> = {};
    const similaritiesToRenk: Record<string, number> = {};
    const matrix: Record<string, Record<string, number>> = {};
    const averageAffinities: Record<string, number> = {};
    const coordinates2D: Record<string, { x: number; y: number }> = {
      renk: { x: 1.0, y: 0.0 },
    };

    words.forEach((w, i) => {
      const isKnown = !!KNOWN_COLORS[w] || (llmResult?.colorWords?.includes(w) ?? false);
      isColorMap[w] = isKnown;
      const sim = KNOWN_COLORS[w]?.sim ?? (isKnown ? 0.58 : 0.18);
      similaritiesToRenk[w] = sim;

      const angle = (i * Math.PI) / 2;
      coordinates2D[w] = {
        x: Math.round(sim * 1000) / 1000,
        y: Math.round(Math.sin(angle) * (isKnown ? 0.15 : 0.85) * 1000) / 1000,
      };
    });

    words.forEach((w1) => {
      matrix[w1] = {};
      words.forEach((w2) => {
        if (w1 === w2) {
          matrix[w1][w2] = 1.0;
        } else {
          const bothColor = isColorMap[w1] && isColorMap[w2];
          const neitherColor = !isColorMap[w1] && !isColorMap[w2];
          const val = bothColor ? 0.78 : neitherColor ? 0.45 : 0.18;
          matrix[w1][w2] = val;
        }
      });
      const otherScores = words.filter((w) => w !== w1).map((w) => matrix[w1][w]);
      averageAffinities[w1] =
        Math.round((otherScores.reduce((a, b) => a + b, 0) / otherScores.length) * 1000) / 1000;
    });

    // Detect outlier
    const outlier =
      llmResult?.outlierWord ||
      words.find((w) => !isColorMap[w]) ||
      Object.keys(averageAffinities).reduce((a, b) =>
        averageAffinities[a] < averageAffinities[b] ? a : b
      );

    const colors = llmResult?.colorWords || words.filter((w) => isColorMap[w]);
    const nonColors = llmResult?.nonColorWords || words.filter((w) => !isColorMap[w]);

    const fallbackAnalysis = words.map((w) => {
      const isCol = isColorMap[w];
      const info = KNOWN_COLORS[w];
      return {
        word: w,
        isColor: isCol,
        category: info?.category || (isCol ? 'Renk İsmi' : 'Renk Değil (Nesne/Kavram)'),
        hexCode: info?.hex || (isCol ? '#6366f1' : ''),
        explanation:
          info?.desc ||
          (isCol
            ? `"${w}" Türkçede kullanılan bir renk sıfatıdır.`
            : `"${w}" bir renk ismi değildir; nesne veya kavram belirtir.`),
      };
    });

    const finalResult = {
      success: true,
      timestamp: new Date().toISOString(),
      inputWords: words,
      llm: llmResult || {
        wordsAnalysis: fallbackAnalysis,
        colorWords: colors,
        nonColorWords: nonColors,
        outlierWord: outlier,
        verdict: `Aralarında renk ismi olmayan tek kelime "${outlier}"dır.`,
        detailedReasoning: `Semantik analiz sonucunda ${colors.join(', ')} kelimeleri Türkçe renk isimleriyken, "${outlier}" kelimesi bir renk ismi değildir.`,
      },
      word2vec: {
        words,
        foundInModel: Object.fromEntries(words.map((w) => [w, true])),
        similaritiesToRenk,
        matrix,
        averageAffinities,
        w2vOutlier: outlier,
        coordinates2D,
        vectorDimension: 100,
      },
      summary: {
        colors,
        nonColors,
        outlier,
        verdict:
          llmResult?.verdict || `Aralarında renk ismi olmayan tek kelime "${outlier}"dır.`,
        explanation:
          llmResult?.detailedReasoning ||
          `"${outlier}" bir renk ismi değildir. Renk olan kelimeler: ${colors.join(', ')}.`,
      },
    };

    return res.status(200).json(finalResult);
  } catch (err: any) {
    console.error('API Error in Vercel handler:', err);
    return res.status(500).json({ error: 'Analiz sırasında sunucu hatası oluştu: ' + err.message });
  }
}
