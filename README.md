# Renk Avcısı (Color Hunter)

4 kelime arasından hangilerinin renk ismi olduğunu bulan ve aralarındaki renk ismi olmayanı anında tespit eden Türkçe Dil Modeli (LLM) ve Word2Vec vektör benzerlik uygulaması.

---

## 📁 Proje Dosya Yapısı (Ayrı Dosyalar)

Tüm dosyalar bağımsız ve kendi formatlarında ayrılmıştır:

```
├── static-app/                   # 🌐 Statik Açılabilir Sürüm (Sunucu Gerektirmez)
│   ├── index.html                # Standalone HTML Arayüzü
│   ├── app.js                    # JavaScript Mantığı ve Renk Analizi
│   ├── styles.css                # CSS Tasarım Stilleri
│   └── data.json                 # Türkçe Renkler Veri Seti (JSON)
│
├── server.ts                     # 🚀 Full-Stack Express Sunucusu
├── server/
│   └── lookup_vectors.py         # 📐 Word2Vec (trModel100) Vektör Sorgulama
│
├── src/                          # ⚛️ React Arayüz Kaynak Kodları
│   ├── App.tsx                   # Ana React Arayüzü
│   ├── main.tsx                  # React DOM Başlatıcı
│   ├── index.css                 # Tailwind CSS Stilleri
│   └── components/
│       └── VectorProjectionCanvas.tsx # 2D Vektör Uzayı İzdüşüm Canvas'ı
│
├── public/                       # Statik Varlıklar ve Modeller
│   ├── static-app/               # Sunulan Statik Dosyalar
│   └── data/
│       └── colors_tr.json        # Zengin Renk Sözlüğü
│
├── package.json                  # NPM Bağımlılıkları ve Scriptler
├── tsconfig.json                 # TypeScript Yapılandırması
└── vite.config.ts                # Vite Derleme Ayarları
```

---

## 🚀 Çalıştırma Yöntemleri

### 1. Statik Olarak Çalıştırma (Sunucusuz & Doğrudan Tarayıcıda)
`static-app/` klasöründeki dosyaları herhangi bir web sunucusuna atabilir veya doğrudan tarayıcınızda açabilirsiniz:
- `static-app/index.html` dosyasını tarayıcınızda açın.
- HTML, JavaScript (`app.js`), CSS (`styles.css`) ve JSON (`data.json`) bağımsız dosyalar olarak birbirine bağlı çalışır.

### 2. Full-Stack Sürüm (Büyük Dil Modeli & Word2Vec ile)
```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (Port 3000)
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

### 3. Vercel Üzerinde Tek Tıkla Canlıya Alma (Vercel Deployment)
Proje Vercel ile tam uyumlu hale getirilmiştir:
- Framework: **Vite**
- Build Command: `vite build`
- Output Directory: `dist`
- Serverless API: `api/analyze.ts` (Vercel Functions)
- Ortam Değişkeni (Opsiyonel): Vercel Dashboard > Settings > Environment Variables kısmına `GEMINI_API_KEY` ekleyebilirsiniz.

---

## 📄 JSON Veri Formatı

Uygulamanın ürettiği ve kullandığı JSON formatı:

```json
{
  "tarih": "2026-10-21T12:00:00.000Z",
  "girilenKelimeler": ["kırmızı", "mavi", "araba", "yeşil"],
  "renkIsimleri": ["kırmızı", "mavi", "yeşil"],
  "renkOlmayanlar": ["araba"],
  "aralarindakiRenkOlmayan": "araba",
  "aciklama": "\"araba\" bir renk ismi değildir. Renk olan kelimeler: kırmızı, mavi, yeşil."
}
```
