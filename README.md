# RevenueOS — Otel Satış & Bütçe Yönetim Sistemi

> Elektra Web PMS entegrasyonlu, AI destekli otel revenue management platformu.

## 🏗️ Proje Yapısı

```
revenueOS/
├── public/
├── src/
│   ├── components/         # React bileşenleri
│   │   ├── Login.jsx       # Giriş ekranı
│   │   ├── Dashboard.jsx   # Ana pano
│   │   ├── Acente.jsx      # Acente yönetimi
│   │   ├── HedefEditor.jsx # Hedef düzenleyici
│   │   ├── Projeksiyon.jsx # Senaryo & simülasyon
│   │   ├── Analiz.jsx      # Pick-up, forecast, kanal mix
│   │   ├── Satis.jsx       # Skor kartı, kotasyon, sözleşme
│   │   ├── Operasyonel.jsx # Takvim, upgrade, blackout
│   │   ├── Bildirim.jsx    # Alert & görev takibi
│   │   ├── Raporlama.jsx   # PDF rapor & CSV export
│   │   ├── ZekaMerkezi.jsx # Rakip fiyat, anomali, insight
│   │   ├── AIAsistan.jsx   # Groq AI sohbet
│   │   ├── KullaniciYonetimi.jsx
│   │   └── Charts.jsx      # SVG grafik bileşenleri
│   ├── data/
│   │   ├── constants.js    # Sabit veriler (kullanıcılar, acenteler, vb.)
│   │   └── themes.js       # Tema tanımları & uygulayıcı
│   ├── utils/
│   │   ├── format.js       # Biçimlendirme yardımcıları
│   │   └── supabase.js     # Supabase client singleton
│   ├── styles/
│   │   └── global.css      # Tüm stiller
│   ├── config.js           # Supabase URL & Key
│   ├── App.jsx             # Ana bileşen & state yönetimi
│   └── main.jsx            # React entry point
├── index.html
├── vite.config.js
├── package.json
└── .github/workflows/deploy.yml  # GitHub Pages otomatik deploy
```

## 🚀 Başlarken

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Build'ı önizle
npm run preview
```

## 🌐 GitHub Pages Deploy

1. Repo'yu GitHub'a push edin
2. Settings → Pages → Source: **GitHub Actions** seçin
3. Her `main` branch push'unda otomatik deploy edilir

## 🔧 Yapılandırma

`src/config.js` dosyasında Supabase bilgilerini güncelleyin:

```js
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_KEY = 'your-anon-key';
```

## 📋 Teknolojiler

- **React 18** — UI framework
- **Vite 5** — Build tool
- **Supabase** — Backend & veritabanı
- **Groq AI** — Llama 3.3 AI asistan
- **SVG** — Özel grafikler (recharts bağımlılığı yok)

## 📜 Lisans

Tüm hakları saklıdır. © 2024 RevenueOS
