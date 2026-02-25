/**
 * Event System Initialization
 * 
 * This module initializes the event-driven cache invalidation system.
 * It should be called once at app startup to set up event listeners.
 * 
 * Call this in the root layout or middleware to enable event-driven updates.
 */

import { initializeCacheInvalidation } from '@/lib/cache/cacheInvalidator';

let initialized = false;

/**
 * Initialize the event-driven architecture
 * Safe to call multiple times - only initializes once
 */
export async function initializeEventDrivenArchitecture(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    console.log('⚙️  Initializing event-driven architecture...');

    // Initialize cache invalidation listeners
    initializeCacheInvalidation();

    initialized = true;
    console.log('✅ Event-driven architecture initialized');
  } catch (error) {
    console.error('❌ Failed to initialize event-driven architecture:', error);
    // Don't throw - allow app to continue with potential degraded functionality
  }
}

/**
 * Check if event system is initialized
 */
export function isEventDrivenArchitectureReady(): boolean {
  return initialized;
}
