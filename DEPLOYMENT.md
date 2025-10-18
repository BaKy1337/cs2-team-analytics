# Configuration de déploiement

## Backend (Render)
- **URL** : https://cs2-team-analytics-1.onrender.com/api
- **Status** : ✅ Fonctionnel

## Frontend (Vercel)
- **Configuration** : `vercel.json` configuré
- **Build** : `cd frontend && npm install --legacy-peer-deps && npm run build`
- **Output** : `frontend/dist`

## Variables d'environnement

### Frontend (Vercel)
- `NODE_ENV=production` (automatique)

### Backend (Render)
- `NODE_ENV=production`
- `PORT=10000`
- `FACEIT_API_KEY=your_faceit_api_key_here` (à configurer)

## CORS Configuration
Le backend accepte les requêtes depuis :
- `http://localhost:3000` (dev)
- `http://localhost:5173` (dev)
- `https://cs2-team-analytics.vercel.app` (prod)
- `https://cs2-team-analytics-git-main-baky1337.vercel.app` (prod)

## URLs de test
- **Frontend** : https://cs2-team-analytics.vercel.app
- **Backend** : https://cs2-team-analytics-1.onrender.com/api
- **Test API** : https://cs2-team-analytics-1.onrender.com/api/health
