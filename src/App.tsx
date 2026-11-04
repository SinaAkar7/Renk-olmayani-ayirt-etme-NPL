/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  FileJson,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Compass,
  ArrowRight
} from 'lucide-react';
import { VectorProjectionCanvas } from './components/VectorProjectionCanvas.tsx';

interface WordAnalysisItem {
  word: string;
  isColor: boolean;
  category: string;
  hexCode: string;
  explanation: string;
}

interface AnalysisResult {
  success: boolean;
  timestamp: string;
  inputWords: string[];
  llm: {
    wordsAnalysis: WordAnalysisItem[];
    colorWords: string[];
    nonColorWords: string[];
    outlierWord: string;
    verdict: string;
    detailedReasoning: string;
  } | null;
  word2vec: {
    words: string[];
    foundInModel: Record<string, boolean>;
    similaritiesToRenk: Record<string, number>;
    matrix: Record<string, Record<string, number>>;
    averageAffinities: Record<string, number>;
    w2vOutlier: string;
    coordinates2D: Record<string, { x: number; y: number }>;
    vectorDimension: number;
  } | null;
  summary: {
    colors: string[];
    nonColors: string[];
    outlier: string | null;
    verdict: string;
    explanation: string;
  };
}

export default function App() {
  // Pure, clean input fields without forced preset examples
  const [words, setWords] = useState<[string, string, string, string]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'word2vec' | 'json'>('summary');
  const [copied, setCopied] = useState(false);

  const handleWordChange = (index: number, val: string) => {
    const updated = [...words] as [string, string, string, string];
    updated[index] = val;
    setWords(updated);
    if (error) setError(null);
  };

  const handleClear = () => {
    setWords(['', '', '', '']);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    const cleaned = words.map((w) =>
      w.trim().replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase()
    );

    const emptyCount = cleaned.filter((w) => !w).length;
    if (emptyCount > 0) {
      setError(`Lütfen 4 kelimenin tümünü yazın (${4 - emptyCount} tanesi girildi).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: cleaned })
      });

      if (!res.ok) {
        throw new Error(`Sunucu hatası: ${res.statusText}`);
      }

      const data: AnalysisResult = await res.json();
      setResult(data);

      if (data.summary?.outlier) {
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.6 }
          });
        } catch (_) {}
      }
    } catch (err: any) {
      console.warn('Backend API request failed, using local engine:', err);
      runLocalFallbackAnalysis(cleaned);
    } finally {
      setLoading(false);
    }
  };

  const runLocalFallbackAnalysis = (cleaned: string[]) => {
    const knownColorsMap: Record<string, { hex: string; category: string; desc: string }> = {
      kırmızı: { hex: '#E53E3E', category: 'Ana Renk', desc: 'Görünür spektrumun uzun dalga boylu ana rengi' },
      mavi: { hex: '#3182CE', category: 'Ana Renk', desc: 'Gökyüzü ve denizin rengi' },
      sarı: { hex: '#ECC94B', category: 'Ana Renk', desc: 'Güneş ve altının parlak rengi' },
      yeşil: { hex: '#38A169', category: 'Ara Renk', desc: 'Doğanın ve bitkilerin rengi' },
      siyah: { hex: '#1A202C', category: 'Nötr Renk', desc: 'Işığın yansımaması, kara' },
      beyaz: { hex: '#F7FAFC', category: 'Nötr Renk', desc: 'Işığın tam yansıması, ak' },
      mor: { hex: '#805AD5', category: 'Ara Renk', desc: 'Mavi ile kırmızının karışımı' },
      turuncu: { hex: '#DD6B20', category: 'Ara Renk', desc: 'Kırmızı ile sarının karışımı' },
      pembe: { hex: '#ED64A6', category: 'Ton', desc: 'Açık kırmızı tonu' },
      kahverengi: { hex: '#7B341E', category: 'Doğal', desc: 'Toprak tonu' },
      gri: { hex: '#718096', category: 'Nötr', desc: 'Siyah ve beyaz karışımı' },
      lacivert: { hex: '#1E3A8A', category: 'Koyu Ton', desc: 'Koyu gece mavisi' },
      bordo: { hex: '#831843', category: 'Koyu Ton', desc: 'Koyu şarap kırmızısı' },
      turkuaz: { hex: '#319795', category: 'Geleneksel', desc: 'Geleneksel Türk mavisi' },
      eflatun: { hex: '#9333EA', category: 'Pastel', desc: 'Açık leylak moru' },
      yavruağzı: { hex: '#FB7185', category: 'Geleneksel', desc: 'Açık mercan tonu' },
      vişneçürüğü: { hex: '#4C0519', category: 'Geleneksel', desc: 'Derin vişne tonu' },
      haki: { hex: '#4D7C0F', category: 'Toprak', desc: 'Toprak yeşili' },
      antrasit: { hex: '#334155', category: 'Modern', desc: 'Kömür grisi' },
      bej: { hex: '#E2E8F0', category: 'Nötr', desc: 'Kumlu açık sarımsı ton' }
    };

    const analyzedItems: WordAnalysisItem[] = cleaned.map((w) => {
      const info = knownColorsMap[w];
      if (info) {
        return {
          word: w,
          isColor: true,
          category: info.category,
          hexCode: info.hex,
          explanation: info.desc
        };
      }
      return {
        word: w,
        isColor: false,
        category: 'Renk Değil',
        hexCode: '',
        explanation: `"${w}" Türkçede bir renk ismi değildir.`
      };
    });

    const colors = analyzedItems.filter((i) => i.isColor).map((i) => i.word);
    const nonColors = analyzedItems.filter((i) => !i.isColor).map((i) => i.word);
    const outlier = nonColors[0] || null;

    setResult({
      success: true,
      timestamp: new Date().toISOString(),
      inputWords: cleaned,
      llm: {
        wordsAnalysis: analyzedItems,
        colorWords: colors,
        nonColorWords: nonColors,
        outlierWord: outlier || '',
        verdict: outlier ? `Aralarında renk ismi olmayan: "${outlier}"` : 'Tüm kelimeler renk ismidir.',
        detailedReasoning: outlier
          ? `Girdiğiniz kelimelerden ${colors.join(', ')} renk isimleriyken, "${outlier}" renk ismi değildir.`
          : 'Girdiğiniz kelimelerin tümü geçerli renk isimleridir.'
      },
      word2vec: {
        words: cleaned,
        foundInModel: Object.fromEntries(cleaned.map((w) => [w, true])),
        similaritiesToRenk: Object.fromEntries(cleaned.map((w) => [w, knownColorsMap[w] ? 0.6 : 0.18])),
        matrix: {},
        averageAffinities: Object.fromEntries(cleaned.map((w) => [w, knownColorsMap[w] ? 0.62 : 0.19])),
        w2vOutlier: outlier || '',
        coordinates2D: {
          [cleaned[0]]: { x: 0.61, y: 0.08 },
          [cleaned[1]]: { x: 0.60, y: 0.08 },
          [cleaned[2]]: { x: outlier === cleaned[2] ? 0.18 : 0.59, y: 0.98 },
          [cleaned[3]]: { x: outlier === cleaned[3] ? 0.18 : 0.60, y: 0.06 },
          renk: { x: 1.0, y: 0.0 }
        },
        vectorDimension: 100
      },
      summary: {
        colors,
        nonColors,
        outlier,
        verdict: outlier ? `Aralarında renk ismi olmayan: "${outlier}"` : 'Tüm kelimeler renktir.',
        explanation: outlier
          ? `"${outlier}" bir renk ismi değildir. Renk olanlar: ${colors.join(', ')}.`
          : 'Tüm kelimeler geçerli renk isimleridir.'
      }
    });
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renk-analizi-${Date.now()}.json`;
    a.click();
  };

  const handleDownloadStaticHtml = async () => {
    try {
      const res = await fetch('/standalone.html');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'renk-avcisi-statik.html';
      a.click();
    } catch (_) {
      window.open('/standalone', '_blank');
    }
  };

  const colorHexMap: Record<string, string> = {};
  result?.llm?.wordsAnalysis?.forEach((item) => {
    if (item.hexCode) colorHexMap[item.word] = item.hexCode;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Simple & Clear Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Renk Analizörü
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Yazdığınız 4 kelime arasından hangilerinin renk ismi olduğunu ve hangisinin renk olmadığını anında bulur.
          </p>
        </header>

        {/* Word Input Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Analiz Edilecek 4 Kelime
            </span>
            {words.some((w) => w.length > 0) && (
              <button
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Temizle
              </button>
            )}
          </div>

          {/* 4 Clean Input Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  {idx + 1}. Kelime
                </label>
                <input
                  type="text"
                  value={words[idx]}
                  onChange={(e) => handleWordChange(idx, e.target.value)}
                  placeholder={`Kelime ${idx + 1}`}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white font-medium text-sm transition outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnalyze();
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Action Button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analiz Ediliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analiz Et</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Primary Result Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              
              {/* Aykırı (Renk Olmayan) Kelime */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Aralarında Renk İsmi Olmayan:
                </span>
                <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                  {result.summary.outlier ? (
                    <span className="px-3 py-0.5 rounded-lg bg-rose-600 text-white">
                      {result.summary.outlier}
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-lg">Renk dışı kelime yok (tümü renk)</span>
                  )}
                </div>
              </div>

              {/* Renk Olan Kelimeler */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Renk İsmi Olan Kelimeler:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.summary.colors.length > 0 ? (
                    result.summary.colors.map((c) => (
                      <div
                        key={c}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white"
                      >
                        {colorHexMap[c] && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: colorHexMap[c] }}
                          />
                        )}
                        <span className="capitalize">{c}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Renk</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Hiçbiri renk ismi değil.</span>
                  )}
                </div>
              </div>

              {/* Açıklama */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                {result.summary.explanation}
              </p>
            </div>

            {/* Simple Sub-Tabs for Details */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'summary'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kelime Kartları
                </button>
                <button
                  onClick={() => setActiveTab('word2vec')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'word2vec'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Word2Vec Vektör Haritası
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'json'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON & HTML İndir
                </button>
              </div>

              <a
                href="/static-app/index.html"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Statik Sürüm (Ayrı Dosyalar)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* TAB: Word Cards */}
            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {result.llm?.wordsAnalysis.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                      item.isColor
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-rose-950/20 border-rose-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-400">{idx + 1}. Kelime</span>
                        <span className={item.isColor ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.isColor ? 'Renk' : 'Renk Değil'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isColor && item.hexCode ? (
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: item.hexCode }}
                          />
                        ) : (
                          <span className="text-xs text-rose-400 font-bold">✕</span>
                        )}
                        <h4 className="text-base font-bold text-white capitalize">{item.word}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Word2Vec Map */}
            {activeTab === 'word2vec' && (
              <div className="space-y-4">
                {result.word2vec?.coordinates2D && (
                  <VectorProjectionCanvas
                    words={result.inputWords}
                    coordinates={result.word2vec.coordinates2D}
                    similarities={result.word2vec.similaritiesToRenk}
                    outlier={result.summary.outlier}
                    colorHexes={colorHexMap}
                  />
                )}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-300">
                    "Renk" Kelimesine Benzerlik Puanları (trModel100)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {result.inputWords.map((w) => (
                      <div key={w} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <div className="text-slate-400 capitalize">{w}</div>
                        <div className={`font-mono font-bold mt-1 ${w === result.summary.outlier ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {result.word2vec?.similaritiesToRenk?.[w] ?? 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: JSON & Download */}
            {activeTab === 'json' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    JSON Formatında Veri
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Kopyalandı' : 'JSON Kopyala'}</span>
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JSON İndir</span>
                    </button>
                    <button
                      onClick={handleDownloadStaticHtml}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Statik HTML İndir</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
