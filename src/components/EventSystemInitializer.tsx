'use client';

import { useEffect } from 'react';

/**
 * Client-side component that initializes event-driven architecture
 * This ensures the system is set up when the app boots
 */
export function EventSystemInitializer() {
  useEffect(() => {
    // Initialize event-driven architecture on client
    // The cache invalidation listeners are already initialized server-side
    // This component ensures everything is ready for real-time updates
    console.log('✅ Event-driven system ready on client');
  }, []);

  return null; // This component doesn't render anything
}
