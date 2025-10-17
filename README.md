# ESEA Helper by Baky

Application complète pour l'analyse d'équipes CS2 avec interface moderne et API backend optimisée.

## 🎯 Fonctionnalités

- **Analyse d'équipes** : Métriques complètes via Faceit API
- **Comparaison** : Analyse comparative entre deux équipes
- **Stratégies de veto** : Recommandations de maps et bans
- **Chargement rapide** : Par Match ID avec 3 modes d'optimisation
- **Interface moderne** : Design system premium et responsive
- **Statistiques avancées** : Données récentes et étendues

## 🏗️ Architecture

```
ESEA Helper by Baky/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Node.js + Express + Redis
└── README.md
```

## 🚀 Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer FACEIT_API_KEY dans .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🎨 Design System

Interface moderne avec :
- **Palette premium** : Couleurs CS2 optimisées
- **Espacement raffiné** : Système d'espacement cohérent
- **Animations fluides** : Transitions et effets subtils
- **Responsive design** : Adaptation à tous les écrans

## 📊 API Endpoints

- `POST /api/team/analyze` - Analyser une équipe
- `POST /api/team/compare` - Comparer deux équipes
- `GET /api/match/:matchId/teams` - Charger les équipes d'un match
- `GET /api/match/:matchId/insights` - Insights détaillés
- `GET /api/player/:playerId/analysis` - Analyse d'un joueur

## 🔧 Technologies

### Frontend
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

### Backend
- Node.js
- Express
- Axios
- Redis
- Bull
- Node-cache

## 📱 Utilisation

1. **Configuration** : Entrer les nicknames des joueurs ou un Match ID
2. **Analyse** : L'application récupère et analyse les données
3. **Comparaison** : Comparer avec l'équipe adverse
4. **Stratégie** : Consulter les recommandations de veto

## 🎯 Optimisations

- **Cache intelligent** : Redis pour les performances
- **Chargement optimisé** : 3 modes (ultra-rapide, optimisé, complet)
- **Queue system** : Bull pour gérer les requêtes API
- **Rate limiting** : Protection contre les abus

## 👨‍💻 Auteur

**Baky** - Développeur de l'ESEA Helper

## 📄 Licence

Projet privé - Tous droits réservés
