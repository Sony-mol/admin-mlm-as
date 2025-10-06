import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeRoot({ children }) {
  const { theme } = useTheme();
  return <div className="theme" data-theme={theme}>{children}</div>; // wrapper holds theme
}
