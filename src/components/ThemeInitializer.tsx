'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    // Fall back to sidebarTheme for users who toggled before the unified key existed
    const storedTheme = localStorage.getItem('theme') || localStorage.getItem('sidebarTheme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}
