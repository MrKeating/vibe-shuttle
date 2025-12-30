/**
 * Build-time validation script for AI Studio exports
 * 
 * Run manually: npx ts-node scripts/validate-ai-studio.ts
 * Or automatically via Vite plugin during build
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  exports: string[];
  files: string[];
}

export function validateAIStudio(rootDir: string = process.cwd()): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    exports: [],
    files: [],
  };

  const aiStudioPath = path.join(rootDir, 'src', 'ai-studio');
  const indexPath = path.join(aiStudioPath, 'index.ts');

  // Check if ai-studio folder exists
  if (!fs.existsSync(aiStudioPath)) {
    result.errors.push('ai-studio folder does not exist at src/ai-studio/');
    result.valid = false;
    return result;
  }

  // Check if index.ts exists
  if (!fs.existsSync(indexPath)) {
    result.errors.push('ai-studio/index.ts does not exist');
    result.valid = false;
    return result;
  }

  // Read index.ts content
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  // Extract exports from index.ts
  const exportMatches = indexContent.match(/export\s+(?:\*\s+from|{[^}]+}\s+from|\w+\s+from)\s+["']\.\/([^"']+)["']/g);
  if (exportMatches) {
    result.exports = exportMatches.map(m => {
      const match = m.match(/["']\.\/([^"']+)["']/);
      return match ? match[1] : '';
    }).filter(Boolean);
  }

  // Find all .ts/.tsx files in ai-studio (excluding index.ts and README)
  const tsFiles = findTsFiles(aiStudioPath).filter(f => 
    !f.endsWith('index.ts') && 
    !f.endsWith('.d.ts') &&
    !f.includes('README')
  );
  
  result.files = tsFiles.map(f => path.relative(aiStudioPath, f));

  // Check for files that aren't exported
  for (const file of result.files) {
    const moduleName = file.replace(/\.(ts|tsx)$/, '');
    const isExported = result.exports.some(exp => 
      exp === moduleName || 
      exp.startsWith(moduleName + '/') ||
      moduleName.startsWith(exp + '/')
    );
    
    if (!isExported) {
      result.warnings.push(`File "${file}" exists but is not exported from index.ts`);
    }
  }

  // Check for exports that reference non-existent files
  for (const exp of result.exports) {
    const possiblePaths = [
      path.join(aiStudioPath, exp + '.ts'),
      path.join(aiStudioPath, exp + '.tsx'),
      path.join(aiStudioPath, exp, 'index.ts'),
      path.join(aiStudioPath, exp, 'index.tsx'),
    ];
    
    const exists = possiblePaths.some(p => fs.existsSync(p));
    if (!exists) {
      result.errors.push(`Export "${exp}" references non-existent module`);
      result.valid = false;
    }
  }

  // Check that version constants exist
  if (!indexContent.includes('AI_STUDIO_VERSION')) {
    result.warnings.push('AI_STUDIO_VERSION constant not found in index.ts');
  }

  if (!indexContent.includes('AI_STUDIO_SYNCED_AT')) {
    result.warnings.push('AI_STUDIO_SYNCED_AT constant not found in index.ts');
  }

  return result;
}

function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// CLI execution
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🔍 Validating AI Studio exports...\n');
  
  const result = validateAIStudio();
  
  console.log(`📁 AI Studio files: ${result.files.length}`);
  console.log(`📤 Configured exports: ${result.exports.length}`);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }
  
  if (result.valid) {
    console.log('\n✅ AI Studio exports are properly configured!');
  }
}
