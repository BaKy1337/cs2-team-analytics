import React, { useState } from 'react';

const SimpleTeamSelector = ({ 
  isOpen, 
  onClose, 
  team1, 
  team2, 
  onSelectTeam 
}) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedTeam) {
      const ourTeam = selectedTeam === 'team1' ? team1 : team2;
      const enemyTeam = selectedTeam === 'team1' ? team2 : team1;
      
      onSelectTeam(ourTeam, enemyTeam);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-cs2-card rounded-lg shadow-2xl border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cs2-light">Choisir votre équipe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cs2-light transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Équipe 1 */}
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTeam === 'team1'
                  ? 'border-cs2-blue bg-cs2-blue/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedTeam('team1')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-cs2-light">
                  {team1.name || 'Équipe 1'}
                </h3>
                {selectedTeam === 'team1' && (
                  <span className="text-cs2-blue">✓</span>
                )}
              </div>
              
              <div className="text-sm text-gray-300">
                {team1.roster?.slice(0, 3).map(player => player.nickname).join(', ')}
                {team1.roster?.length > 3 && ', ...'}
              </div>
            </div>

            {/* Équipe 2 */}
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTeam === 'team2'
                  ? 'border-cs2-blue bg-cs2-blue/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedTeam('team2')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-cs2-light">
                  {team2.name || 'Équipe 2'}
                </h3>
                {selectedTeam === 'team2' && (
                  <span className="text-cs2-blue">✓</span>
                )}
              </div>
              
              <div className="text-sm text-gray-300">
                {team2.roster?.slice(0, 3).map(player => player.nickname).join(', ')}
                {team2.roster?.length > 3 && ', ...'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTeam}
              className={`flex-1 font-bold py-2 px-4 rounded-lg transition-colors ${
                selectedTeam
                  ? 'bg-cs2-blue hover:bg-cs2-blue-dark text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTeamSelector;