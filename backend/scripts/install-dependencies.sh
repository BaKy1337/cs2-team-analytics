#!/bin/bash

echo "🚀 Installation des dépendances optimisées..."

# Installer les nouvelles dépendances
npm install redis@^4.6.0 bull@^4.12.0 express-rate-limit@^7.1.0

# Vérifier l'installation
echo "✅ Dépendances installées:"
npm list redis bull express-rate-limit

echo "📋 Prochaines étapes:"
echo "1. Configurer Redis (optionnel): docker run -d -p 6379:6379 redis:alpine"
echo "2. Copier env.example vers .env et configurer FACEIT_API_KEY"
echo "3. Démarrer le serveur optimisé: node server-optimized.js"
