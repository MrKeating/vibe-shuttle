/**
 * AI Studio Bridge - Main Export Surface
 * 
 * This is the stable export surface for all AI Studio code synced via git subtree.
 * Add exports here for any modules that should be accessible to the main app.
 * 
 * Usage in app code:
 *   import { Something } from "@/ai";
 *   import { specific } from "@ai/specific-module";
 */

// Export AI Studio modules here as they are added
export * from "./utils/greet";

// Version constant for tracking
export const AI_STUDIO_VERSION = "1.0.0";
