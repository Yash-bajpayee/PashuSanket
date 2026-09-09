# PashuSuraksha — Firebase Deployment Package

Isme 2 alag options hain, apni zarurat ke hisaab se ek choose karo.

## Option A — `static-hosting/` (sabse fast, 5 min, koi build nahi)

Standalone HTML prototype hai — koi backend/database connected nahi, sirf demo ke liye. Firebase Hosting par turant deploy ho jayega:

```bash
npm install -g firebase-tools
cd static-hosting
firebase login
firebase init hosting   # existing firebase.json use karo jab pucha jaye
firebase deploy
```

Ya agar already Firebase project bana hua hai, `.firebaserc.example` ko `.firebaserc` banao aur apna project ID daal do, phir seedha `firebase deploy` chalao.

## Option B — `react-firebase-app/` (real backend, Firestore-connected)

Yeh poora React app hai jo Firestore database se live data padhta/likhta hai (jo humne pehle banaya tha). Isme build step lagega:

```bash
cd react-firebase-app
npm install
# .env.example ko .env banao aur apni Firebase config values daalo
npm run build
firebase login
firebase init hosting   # "dist" ko public directory batana, existing firebase.json use karo
firebase deploy
```

Poora detailed step-by-step (Firestore project banane se lekar seeding tak) **`react-firebase-app/SETUP-GUIDE.md`** me hai — usi guide ko follow karo.

## Naya: Login / Register / Admin (react-firebase-app mein)

`react-firebase-app/` mein ab ek login screen, registration screen, aur admin panel bhi hai (frontend-only UI flow — real Firebase Authentication nahi, `src/App.jsx` ke top pe `MOCK_USERS` comment mein likha hai ki production ke liye kya add karna hoga).

Demo credentials (login screen pe bhi dikhte hain):
- Farmer: `ramesh@farm.in` / `demo123`
- Veterinarian: `anjali@vet.in` / `demo123`
- Admin: `admin@pashusuraksha.in` / `admin123`

Naya registration bhi kar sakte ho — Farmer/Vet role choose karke; naya vet account "Pending Verification" status mein aata hai jab tak Admin Panel se verify na kiya jaye.

## Kaunsa choose karu?

- Bas kal ke presentation ke liye ek live link chahiye, backend se matlab nahi → **Option A**
- Judges ko real Firestore connection dikhana hai (case insert/verify live database me) → **Option B**
