import React, { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContext';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('appDarkMode');
      if (savedTheme !== null) {
        return savedTheme === 'true';
      }
      // Check system preference if no saved theme
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('appDarkMode', newMode.toString());
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
