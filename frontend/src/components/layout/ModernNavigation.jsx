import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  BarChart3, 
  Users, 
  Swords, 
  Map, 
  Settings,
  Zap
} from 'lucide-react';

const navItems = [
  { 
    name: 'Dashboard', 
    icon: BarChart3, 
    tab: 'dashboard', 
    description: 'Vue d\'ensemble' 
  },
  { 
    name: 'Comparaison', 
    icon: Users, 
    tab: 'comparison', 
    description: 'Analyser les équipes' 
  },
  { 
    name: 'Tactique', 
    icon: Swords, 
    tab: 'analysis', 
    description: 'Stratégies' 
  },
  { 
    name: 'Maps', 
    icon: Map, 
    tab: 'map-pool', 
    description: 'Performance cartes' 
  },
  { 
    name: 'Paramètres', 
    icon: Settings, 
    tab: 'settings', 
    description: 'Configuration' 
  },
];

const ModernNavigation = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="nav">
      <div className="nav-container">
        {/* Logo */}
        <motion.a
          href="#"
          className="nav-brand flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap className="w-6 h-6 text-primary-500" />
          <span className="text-gradient">FaceitHelper</span>
        </motion.a>

        {/* Menu mobile toggle */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation links */}
        <ul className="nav-links hidden md:flex">
          {navItems.map((item) => (
            <motion.li key={item.name}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.tab);
                }}
                className={`nav-link flex items-center gap-2 ${
                  activeTab === item.tab ? 'active' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={16} />
                <span>{item.name}</span>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden bg-bg-secondary border-t border-border-primary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container py-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <motion.li key={item.name}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.tab);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        activeTab === item.tab 
                          ? 'bg-primary-500/10 text-primary-500' 
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon size={18} />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-text-tertiary">{item.description}</div>
                      </div>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default ModernNavigation;
