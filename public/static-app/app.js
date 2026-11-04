// Standalone JavaScript Logic for Color Hunter
let colorDatabase = {};

// Load color database from data.json
async function loadDatabase() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    colorDatabase = data.colors || {};
  } catch (e) {
    console.warn('Could not fetch data.json, using fallback colors');
    colorDatabase = {
      "kırmızı": { hex: "#E53E3E" },
      "mavi": { hex: "#3182CE" },
      "sarı": { hex: "#ECC94B" },
      "yeşil": { hex: "#38A169" },
      "siyah": { hex: "#1A202C" },
      "beyaz": { hex: "#F8FAFC" },
      "mor": { hex: "#805AD5" },
      "turuncu": { hex: "#DD6B20" },
      "turkuaz": { hex: "#319795" },
      "pembe": { hex: "#ED64A6" },
      "kahverengi": { hex: "#7B341E" },
      "gri": { hex: "#718096" },
      "lacivert": { hex: "#1E3A8A" },
      "bordo": { hex: "#831843" },
      "eflatun": { hex: "#9333EA" }
    };
  }
}

function cleanWord(str) {
  return (str || '').trim().replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
}

let latestAnalysis = null;

function analyze() {
  const words = [
    cleanWord(document.getElementById('word0').value),
    cleanWord(document.getElementById('word1').value),
    cleanWord(document.getElementById('word2').value),
    cleanWord(document.getElementById('word3').value)
  ];

  if (words.some(w => !w)) {
    alert('Lütfen 4 kelimenin tümünü yazınız.');
    return;
  }

  const colors = [];
  const nonColors = [];

  words.forEach(w => {
    if (colorDatabase[w]) {
      colors.push(w);
    } else {
      nonColors.push(w);
    }
  });

  const outlier = nonColors[0] || null;
  let explanation = '';

  if (outlier) {
    explanation = `"${outlier}" bir renk ismi değildir. Renk olan kelimeler: ${colors.join(', ')}.`;
  } else {
    explanation = 'Girdiğiniz 4 kelimenin tümü geçerli renk isimleridir.';
  }

  latestAnalysis = {
    tarih: new Date().toISOString(),
    girilenKelimeler: words,
    renkIsimleri: colors,
    renkOlmayanlar: nonColors,
    aralarindakiRenkOlmayan: outlier,
    aciklama: explanation
  };

  // Render UI
  const resultsCard = document.getElementById('resultsCard');
  resultsCard.classList.remove('hidden');

  const outlierText = document.getElementById('outlierText');
  if (outlier) {
    outlierText.innerHTML = `<span class="outlier-value">${outlier}</span>`;
  } else {
    outlierText.innerHTML = `<span style="color: #34d399; font-weight: 700;">Renk dışı kelime yok (tümü renk)</span>`;
  }

  const chipsContainer = document.getElementById('colorChips');
  chipsContainer.innerHTML = '';
  if (colors.length > 0) {
    colors.forEach(c => {
      const hex = colorDatabase[c]?.hex || '#6366f1';
      const chip = document.createElement('div');
      chip.className = 'color-chip';
      chip.innerHTML = `
        <span class="color-dot" style="background-color: ${hex}"></span>
        <span>${c}</span>
        <span class="badge">✓ Renk</span>
      `;
      chipsContainer.appendChild(chip);
    });
  } else {
    chipsContainer.innerHTML = '<span style="color: #64748b; font-size: 0.8rem; font-style: italic;">Hiçbiri renk ismi değil.</span>';
  }

  document.getElementById('explanationText').textContent = explanation;
  document.getElementById('jsonViewer').textContent = JSON.stringify(latestAnalysis, null, 2);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadDatabase();

  document.getElementById('analyzeBtn').addEventListener('click', analyze);

  document.getElementById('clearBtn').addEventListener('click', () => {
    for (let i = 0; i < 4; i++) {
      document.getElementById(`word${i}`).value = '';
    }
    document.getElementById('resultsCard').classList.add('hidden');
  });

  document.getElementById('copyJsonBtn').addEventListener('click', () => {
    if (!latestAnalysis) return;
    navigator.clipboard.writeText(JSON.stringify(latestAnalysis, null, 2)).then(() => {
      alert('JSON kopyalandı!');
    });
  });

  document.getElementById('downloadJsonBtn').addEventListener('click', () => {
    if (!latestAnalysis) return;
    const blob = new Blob([JSON.stringify(latestAnalysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renk-analizi-${Date.now()}.json`;
    a.click();
  });
});
