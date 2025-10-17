# ESEA Helper by Baky - Backend

API backend pour l'analyse d'équipes CS2 avec intégration Faceit et métriques avancées.

## Fonctionnalités

- 🔗 Intégration Faceit API
- 📊 Analyse d'équipes avec métriques avancées
- 🎯 Comparaison d'équipes et recommandations
- ⚡ Cache intelligent et optimisations
- 🚀 Chargement rapide par Match ID
- 📈 Statistiques récentes et étendues

## Technologies

- Node.js
- Express
- Axios
- Redis (cache)
- Bull (queue)
- Node-cache

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` :

```env
FACEIT_API_KEY=your_faceit_api_key
REDIS_URL=redis://localhost:6379
```

## Développement

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Routes

- `POST /api/team/analyze` - Analyser une équipe
- `POST /api/team/compare` - Comparer deux équipes
- `GET /api/match/:matchId/teams` - Charger les équipes d'un match
- `GET /api/match/:matchId/insights` - Insights détaillés d'un match
- `GET /api/player/:playerId/analysis` - Analyse d'un joueur

## Auteur

**Baky** - Développeur de l'ESEA Helper
