import { useState } from 'react';
import { Download, Map, Ban, Check, Shuffle } from 'lucide-react';

const MAP_EMOJIS = {
  'Dust2': '🏜️',
  'Mirage': '🌴',
  'Nuke': '☢️',
  'Ancient': '🏛️',
  'Train': '🚂',
  'Inferno': '🔥',
  'Overpass': '🌉'
};

export default function VetoCalculator({ myTeam, enemyTeam, mapRecommendations }) {
  const [weStartFirst, setWeStartFirst] = useState(true);

  const calculateVeto = (startFirst) => {
    // Trier maps par avantage/désavantage
    const sortedMaps = [...mapRecommendations].sort((a, b) => a.diff - b.diff);
    
    // Nos bans: maps où on est le plus faible
    const ourBans = sortedMaps.slice(0, 3).map(m => m.map);
    // Leurs bans probables: leurs maps faibles (nos maps fortes)
    const theirBans = sortedMaps.slice(-3).reverse().map(m => m.map);

    let sequence = [];
    if (startFirst) {
      // A-B-B-A-A-B
      sequence = [
        { team: 'us', action: 'ban', map: ourBans[0] },
        { team: 'them', action: 'ban', map: theirBans[0] },
        { team: 'them', action: 'ban', map: theirBans[1] },
        { team: 'us', action: 'ban', map: ourBans[1] },
        { team: 'us', action: 'ban', map: ourBans[2] },
        { team: 'them', action: 'ban', map: theirBans[2] },
      ];
    } else {
      // B-A-A-B-B-A
      sequence = [
        { team: 'them', action: 'ban', map: theirBans[0] },
        { team: 'us', action: 'ban', map: ourBans[0] },
        { team: 'us', action: 'ban', map: ourBans[1] },
        { team: 'them', action: 'ban', map: theirBans[1] },
        { team: 'them', action: 'ban', map: theirBans[2] },
        { team: 'us', action: 'ban', map: ourBans[2] },
      ];
    }

    // Map restante
    const bannedMaps = sequence.map(s => s.map);
    const remainingMap = mapRecommendations.find(m => !bannedMaps.includes(m.map));

    return { sequence, remainingMap };
  };

  const scenario1 = calculateVeto(true);
  const scenario2 = calculateVeto(false);

  const exportToCSV = () => {
    let csv = 'Scénario,Équipe,Action,Map,Notre WR,Leur WR,Différentiel\n';
    
    scenario1.sequence.forEach((s) => {
      const mapData = mapRecommendations.find(m => m.map === s.map);
      csv += `Nous bannons en premier,${s.team === 'us' ? 'Nous' : 'Eux'},Ban,${s.map},${mapData?.our_wr || 0}%,${mapData?.their_wr || 0}%,${mapData?.diff?.toFixed(1) || 0}%\n`;
    });
    csv += `Nous bannons en premier,Final,Pick,${scenario1.remainingMap.map},${scenario1.remainingMap.our_wr}%,${scenario1.remainingMap.their_wr}%,${scenario1.remainingMap.diff.toFixed(1)}%\n\n`;
    
    scenario2.sequence.forEach((s) => {
      const mapData = mapRecommendations.find(m => m.map === s.map);
      csv += `Ils bannent en premier,${s.team === 'us' ? 'Nous' : 'Eux'},Ban,${s.map},${mapData?.our_wr || 0}%,${mapData?.their_wr || 0}%,${mapData?.diff?.toFixed(1) || 0}%\n`;
    });
    csv += `Ils bannent en premier,Final,Pick,${scenario2.remainingMap.map},${scenario2.remainingMap.our_wr}%,${scenario2.remainingMap.their_wr}%,${scenario2.remainingMap.diff.toFixed(1)}%\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs2-veto-plan-${Date.now()}.csv`;
    a.click();
  };

  const ScenarioCard = ({ scenario, title, color }) => (
    <div className={`card-cs2 p-6 border-l-4 border-${color}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Map className={`text-${color}`} />
          {title}
        </h3>
        <div className={`badge badge-lg bg-${color} text-white font-bold`}>
          A-B-B-A-A-B
        </div>
      </div>

      <div className="space-y-3">
        {scenario.sequence.map((step, idx) => {
          const mapData = mapRecommendations.find(m => m.map === step.map);
          
          return (
            <div 
              key={idx} 
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                step.team === 'us' 
                  ? 'bg-cs2-success/10 border-cs2-success/30' 
                  : 'bg-cs2-error/10 border-cs2-error/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    step.team === 'us' ? 'bg-cs2-success' : 'bg-cs2-error'
                  }`}>
                    {MAP_EMOJIS[step.map]}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{step.map}</div>
                    <div className="text-xs text-gray-400">
                      {step.team === 'us' ? '🛡️ Notre ban' : '⚔️ Leur ban'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    <span className="text-cs2-success">{mapData?.our_wr}%</span>
                    <span className="text-gray-600 mx-2">vs</span>
                    <span className="text-cs2-error">{mapData?.their_wr}%</span>
                  </div>
                  <div className={`text-xs ${mapData?.diff > 0 ? 'text-cs2-success' : 'text-cs2-error'}`}>
                    {mapData?.diff > 0 ? '+' : ''}{mapData?.diff.toFixed(1)}% diff
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Map finale */}
        <div className="relative mt-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cs2-accent/20 to-cs2-orange/20 blur-xl" />
          <div className="relative p-6 bg-gradient-to-br from-cs2-card to-cs2-dark rounded-xl border-2 border-cs2-accent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cs2-accent flex items-center justify-center text-3xl">
                  {MAP_EMOJIS[scenario.remainingMap.map]}
                </div>
                <div>
                  <div className="text-xs text-cs2-accent font-bold mb-1">✓ MAP JOUÉE</div>
                  <div className="text-2xl font-bold">{scenario.remainingMap.map}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">
                  <span className="text-cs2-success">{scenario.remainingMap.our_wr}%</span>
                  <span className="text-gray-600 mx-2">vs</span>
                  <span className="text-cs2-error">{scenario.remainingMap.their_wr}%</span>
                </div>
                <div className={`badge badge-lg ${
                  scenario.remainingMap.diff > 5 ? 'badge-success' : 
                  scenario.remainingMap.diff < -5 ? 'badge-error' : 
                  'badge-warning'
                }`}>
                  {scenario.remainingMap.diff > 0 ? 'Avantage Nous' : 
                   scenario.remainingMap.diff < 0 ? 'Avantage Eux' : 
                   'Équilibré'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">🗺️ Calculateur de Veto</h2>
          <p className="text-gray-400">Stratégie optimale pour le ban des maps</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn-cs2 flex items-center gap-2"
        >
          <Download size={18} />
          Exporter CSV
        </button>
      </div>

      {/* Légende */}
      <div className="card-cs2 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Ban className="text-cs2-error" size={16} />
            <span className="text-gray-400">Système A-B-B-A-A-B (6 bans, 1 map restante)</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cs2-success" />
              <span className="text-gray-400">Nos bans</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cs2-error" />
              <span className="text-gray-400">Leurs bans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scénarios */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScenarioCard 
          scenario={scenario1} 
          title="Scénario 1: Nous bannons en premier"
          color="cs2-success"
        />
        <ScenarioCard 
          scenario={scenario2} 
          title="Scénario 2: Ils bannent en premier"
          color="cs2-error"
        />
      </div>

      {/* Analyse comparative des scénarios */}
      <div className="card-cs2 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shuffle className="text-cs2-orange" />
          Analyse des Scénarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-2">Si nous bannons en premier</div>
            <div className="text-2xl font-bold mb-2">{scenario1.remainingMap.map}</div>
            <div className={`text-lg ${scenario1.remainingMap.diff > 0 ? 'text-cs2-success' : 'text-cs2-error'}`}>
              {scenario1.remainingMap.diff > 0 ? '+' : ''}{scenario1.remainingMap.diff.toFixed(1)}% d'avantage
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Si ils bannent en premier</div>
            <div className="text-2xl font-bold mb-2">{scenario2.remainingMap.map}</div>
            <div className={`text-lg ${scenario2.remainingMap.diff > 0 ? 'text-cs2-success' : 'text-cs2-error'}`}>
              {scenario2.remainingMap.diff > 0 ? '+' : ''}{scenario2.remainingMap.diff.toFixed(1)}% d'avantage
            </div>
          </div>
        </div>

        {/* Recommandation finale */}
        <div className="mt-6 p-4 bg-cs2-accent/10 border border-cs2-accent/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Check className="text-cs2-accent flex-shrink-0 mt-1" size={24} />
            <div>
              <div className="font-bold text-lg mb-2">💡 Recommandation Stratégique</div>
              <p className="text-gray-300 text-sm">
                {Math.abs(scenario1.remainingMap.diff) > Math.abs(scenario2.remainingMap.diff)
                  ? `Privilégiez de bannir EN PREMIER pour jouer ${scenario1.remainingMap.map} (meilleur différentiel: ${scenario1.remainingMap.diff.toFixed(1)}%)`
                  : `Laissez-les bannir EN PREMIER pour jouer ${scenario2.remainingMap.map} (meilleur différentiel: ${scenario2.remainingMap.diff.toFixed(1)}%)`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}