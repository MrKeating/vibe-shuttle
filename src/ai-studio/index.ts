/**
 * AI Studio Bridge - Main Export Surface
 * 
 * This is the stable export surface for all AI Studio code synced via git subtree.
 * 
 * IMPORTANT: Only export modules that are known to exist and compile correctly.
 * When new files are synced from AI Studio, manually add exports here after
 * verifying they compile.
 * 
 * Usage in app code:
 *   import { Something } from "@/ai";
 *   import { specific } from "@ai/specific-module";
 */

// Version constant for tracking
export const AI_STUDIO_VERSION = "1.0.0";

// ============================================
// SAFE EXPORTS ONLY - Add new exports manually
// ============================================
// 
// After syncing files from AI Studio:
// 1. Check that the files compile without errors
// 2. Add exports here for modules you want to use
// 
// Example:
//   export * from "./utils/greet";
//   export { myFunction } from "./my-module";
// 
// DO NOT use wildcard exports for the entire folder as this
// can cause build failures if any synced file has errors.
