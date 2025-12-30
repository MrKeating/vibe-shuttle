/**
 * Vite Plugin: AI Studio Validation
 * 
 * Validates ai-studio exports during build and logs included modules.
 */

import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

export function aiStudioPlugin(): Plugin {
  let aiStudioModules: string[] = [];
  
  return {
    name: 'vite-ai-studio-plugin',
    
    // Run validation at build start
    buildStart() {
      const rootDir = process.cwd();
      const aiStudioPath = path.join(rootDir, 'src', 'ai-studio');
      const indexPath = path.join(aiStudioPath, 'index.ts');
      
      console.log('\n🔗 AI Studio Bridge Validation');
      console.log('─'.repeat(40));
      
      if (!fs.existsSync(indexPath)) {
        console.log('⚠️  ai-studio/index.ts not found');
        return;
      }
      
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Extract version info
      const versionMatch = content.match(/AI_STUDIO_VERSION\s*=\s*["']([^"']+)["']/);
      const syncedMatch = content.match(/AI_STUDIO_SYNCED_AT\s*=\s*["']([^"']+)["']/);
      
      if (versionMatch) {
        console.log(`📦 Version: ${versionMatch[1]}`);
      }
      if (syncedMatch) {
        console.log(`🕐 Last synced: ${syncedMatch[1]}`);
      }
      
      // Find exports
      const exportMatches = content.match(/export\s+(?:\*\s+from|{[^}]+}\s+from)\s+["']\.\/([^"']+)["']/g);
      if (exportMatches) {
        aiStudioModules = exportMatches.map(m => {
          const match = m.match(/["']\.\/([^"']+)["']/);
          return match ? match[1] : '';
        }).filter(Boolean);
        
        if (aiStudioModules.length > 0) {
          console.log(`📤 Exported modules: ${aiStudioModules.join(', ')}`);
        }
      }
      
      console.log('─'.repeat(40) + '\n');
    },
    
    // Track which ai-studio modules are actually imported
    resolveId(source, importer) {
      if (source.startsWith('@ai/') || source === '@/ai' || source.includes('ai-studio')) {
        const moduleName = source.replace('@ai/', '').replace('@/ai', 'index');
        if (!aiStudioModules.includes(moduleName) && moduleName !== 'index') {
          aiStudioModules.push(moduleName);
        }
      }
      return null; // Let Vite handle resolution
    },
    
    // Log summary at build end
    buildEnd() {
      if (aiStudioModules.length > 0) {
        console.log('\n✅ AI Studio modules included in build:');
        aiStudioModules.forEach(m => console.log(`   - ${m}`));
        console.log('');
      }
    },
  };
}

export default aiStudioPlugin;
