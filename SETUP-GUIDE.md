# PashuSuraksha — Firebase Setup Guide (aaj ke liye)

Supabase ka free-tier limit hit ho gaya, so ab Firebase (Firestore) use karenge. Achi baat yeh hai ki Firebase me "test mode" security rules milte hain — matlab SQL/RLS likhne ki zarurat nahi, aur seeding bhi app khud kar leta hai pehli baar chalne par. Total time ~30–40 min.

---

## Step 1 — Firebase project banao (5 min)

1. https://console.firebase.google.com par jao → **Add project**.
2. Naam do (e.g. `pashusuraksha`) → Google Analytics ka toggle off kar sakte ho (demo ke liye zarurat nahi) → **Create project**.
3. Project khulne ke baad, left sidebar me **Build → Firestore Database** par jao → **Create database**.
4. **Start in test mode** choose karo (yeh 30 din ke liye sabko read/write allow karta hai — demo ke liye perfect, koi rules file likhni nahi padegi) → apne region ke paas wala location choose karo → **Enable**.

## Step 2 — Web app register karo aur config copy karo (3 min)

1. Project Overview page par **`</>`** (web) icon click karo → app ka naam do (e.g. `pashusuraksha-web`) → **Register app**.
2. Jo `firebaseConfig` object dikhega usme se yeh 6 values copy kar lo: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

## Step 3 — React project set up karo (10 min)

Agar pehle se React project nahi hai:

```bash
npm create vite@latest pashusuraksha -- --template react
cd pashusuraksha
npm install
npm install firebase lucide-react recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` me:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

`src/index.css` ke sabse upar (purana content hata ke):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Step 4 — App files copy karo (5 min)

1. Diya gaya **`pashu-suraksha.jsx`** ko `src/App.jsx` bana ke daalo.
2. **`firebaseClient.js`** ko `src/firebaseClient.js` me copy karo.
3. Root folder me **`.env`** file banao (`.env.example` ke jaisa) aur Step 2 ki values daalo:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. `src/main.jsx` me check karo `import App from './App.jsx'` aur `import './index.css'` dono hain.

## Step 5 — Run aur test karo (5 min)

```bash
npm run dev
```

1. `http://localhost:5173` kholo.
2. Nav bar me **"● connecting…"** phir **"● Firebase live"** (green) dikhna chahiye. Pehli baar load hote hi app khud demo data (COW-1024, CASE-4471, etc.) Firestore me likh dega — koi manual seeding nahi karni.
3. Firebase Console → Firestore Database me jaake dekho, `animals`, `cases`, `vaccinations` collections ban chuki hongi.
4. Poora journey test karo:
   - Farmer view → **Analyze Animal** → symptoms select karo → **Analyze** → result dikhega → naya case Firestore ke `cases` collection me turant dikhega.
   - Veterinarian view → naya case list me dikhega → **Verify** click karo → Firestore me status "Verified" ho jayega.

## Step 6 — Kal ke presentation ke liye deploy (optional, 10 min)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Deploy hone ke baad Vercel dashboard → **Settings → Environment Variables** me wahi 6 Firebase variables daalo, phir `vercel --prod` dobara chalao taaki unke saath rebuild ho.

(Firebase Hosting bhi use kar sakte ho — `firebase deploy` — lekin Vercel zyada fast hai agar already Vite se familiar ho.)

## Demo-day safety net

- Firebase se connection fail ho jaye to app apne aap built-in demo data par fall back kar leta hai — screen blank nahi hogi.
- Test-mode rules 30 din baad expire ho jaati hain — uske baad Firestore rules tab me proper rules likhni padengi, lekin kal ke presentation ke liye koi dikkat nahi.
- AI analysis abhi ek rule-based heuristic hai (`assessRisk` function, `App.jsx` ke top par). Slide me "current build: rule-based triage layer; production: CNN + NLP model via `/api/analyze`" bolke present karna sabse safe hai.

## Agar kuch atke

- **"Firebase error" badge**: browser console (F12) kholo — zyada tar reason `.env` variable name galat hoga ya dev server restart nahi kiya (`Ctrl+C` phir `npm run dev`).
- **"Missing or insufficient permissions" error**: Firestore rules test mode me nahi hain — Firestore Database → Rules tab me check karo `allow read, write: if true;` (test mode) hona chahiye.
- **Blank white screen**: console error dekho, `firebaseClient.js` ka path/import check karo.
