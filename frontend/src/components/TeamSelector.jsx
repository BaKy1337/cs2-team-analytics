import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Check } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

const TeamSelector = ({ 
  isOpen, 
  onClose, 
  team1, 
  team2, 
  matchInfo,
  onSelectTeam 
}) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleConfirm = () => {
    if (selectedTeam) {
      const ourTeam = selectedTeam === 'team1' ? team1 : team2;
      const enemyTeam = selectedTeam === 'team1' ? team2 : team1;
      
      onSelectTeam(ourTeam, enemyTeam);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choisir votre équipe"
      size="md"
    >
      <div className="space-y-4">
        {/* Recap rapide des 2 équipes */}
        <div className="grid grid-cols-2 gap-4">
          {/* Équipe 1 */}
          <motion.div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTeam === 'team1'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => setSelectedTeam('team1')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">
                {team1.name || 'Équipe 1'}
              </h3>
              {selectedTeam === 'team1' && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
            </div>
            
            <div className="space-y-1">
              {team1.roster?.slice(0, 5).map((player) => (
                <div key={player.player_id} className="text-sm text-gray-300">
                  • {player.nickname}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Équipe 2 */}
          <motion.div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTeam === 'team2'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => setSelectedTeam('team2')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">
                {team2.name || 'Équipe 2'}
              </h3>
              {selectedTeam === 'team2' && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
            </div>
            
            <div className="space-y-1">
              {team2.roster?.slice(0, 5).map((player) => (
                <div key={player.player_id} className="text-sm text-gray-300">
                  • {player.nickname}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Actions simples */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedTeam}
            className="flex-1"
          >
            <Users className="w-4 h-4" />
            Confirmer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TeamSelector;
