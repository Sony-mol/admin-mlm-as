import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg px-3 py-1.5 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
      title="Toggle theme"
    >
      {theme === 'dark' ? '🌙 Dark' : '🌞 Light'}
    </button>
  );
}
