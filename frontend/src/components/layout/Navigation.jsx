import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Target, 
  Settings, 
  Menu, 
  X,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react';

const Navigation = ({ activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Vue d\'ensemble de l\'équipe'
    },
    {
      id: 'analysis',
      label: 'Analyse',
      icon: TrendingUp,
      description: 'Analyse détaillée des performances'
    },
    {
      id: 'comparison',
      label: 'Comparaison',
      icon: Target,
      description: 'Comparaison entre équipes'
    },
    {
      id: 'strategy',
      label: 'Stratégie',
      icon: Shield,
      description: 'Stratégies de veto et tactiques'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      description: 'Configuration de l\'application'
    }
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <>
      {/* Navigation Desktop */}
      <nav className="hidden lg:flex flex-col w-64 bg-cs2-dark border-r border-cs2-dark-lighter h-full">
        <div className="p-6 border-b border-cs2-dark-lighter">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cs2-primary to-cs2-secondary rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FaceitHelper</h1>
              <p className="text-xs text-cs2-gray-light">Pro Analysis Tool</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-cs2-primary text-white shadow-lg' 
                      : 'text-cs2-gray-light hover:bg-cs2-dark-lighter hover:text-white'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-cs2-dark-lighter">
          <div className="text-xs text-cs2-gray text-center">
            Version 2.0 • CS2 Ready
          </div>
        </div>
      </nav>
      
      {/* Navigation Mobile */}
      <div className="lg:hidden">
        {/* Header Mobile */}
        <div className="flex items-center justify-between p-4 bg-cs2-dark border-b border-cs2-dark-lighter">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cs2-primary to-cs2-secondary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">FaceitHelper</h1>
          </div>
          
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-cs2-gray-light hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Menu Mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-cs2-dark border-b border-cs2-dark-lighter"
            >
              <div className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        isActive 
                          ? 'bg-cs2-primary text-white' 
                          : 'text-cs2-gray-light hover:bg-cs2-dark-lighter hover:text-white'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs opacity-75">{tab.description}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Navigation;
