import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="btn-modern btn-outline relative overflow-hidden group"
      title="Toggle theme"
    >
      <span className="relative z-10 flex items-center gap-2">
        {theme === 'dark' ? (
          <>
            <span className="text-lg">🌙</span>
            <span>Dark</span>
          </>
        ) : (
          <>
            <span className="text-lg">🌞</span>
            <span>Light</span>
          </>
        )}
      </span>
      <span className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
    </button>
  );
}
