/**
 * Runtime utility to verify AI Studio code is included in the build
 * 
 * Usage in browser console or component:
 *   import { checkAIStudioBuild } from '@/lib/checkAIStudioBuild';
 *   checkAIStudioBuild();
 */

import { AI_STUDIO_VERSION, AI_STUDIO_SYNCED_AT } from '@/ai';

export interface AIStudioBuildInfo {
  included: boolean;
  version: string;
  syncedAt: string;
  message: string;
}

export function checkAIStudioBuild(): AIStudioBuildInfo {
  const info: AIStudioBuildInfo = {
    included: false,
    version: 'unknown',
    syncedAt: 'unknown',
    message: '',
  };

  try {
    info.version = AI_STUDIO_VERSION;
    info.syncedAt = AI_STUDIO_SYNCED_AT;
    info.included = true;
    info.message = `✅ AI Studio v${info.version} is included in build (synced: ${info.syncedAt})`;
    
    console.log('─'.repeat(50));
    console.log('🔗 AI Studio Build Verification');
    console.log('─'.repeat(50));
    console.log(`📦 Version: ${info.version}`);
    console.log(`🕐 Synced: ${info.syncedAt}`);
    console.log(`✅ Status: Included in build`);
    console.log('─'.repeat(50));
  } catch (error) {
    info.message = '❌ AI Studio code not found in build';
    console.error(info.message, error);
  }

  return info;
}

// Auto-log in development
if (import.meta.env.DEV) {
  // Delay to ensure modules are loaded
  setTimeout(() => {
    console.log('\n[DEV] AI Studio build check:');
    checkAIStudioBuild();
  }, 100);
}
