/**
 * AI Bridge Entrypoint
 * 
 * This file serves as the stable bridge between the main app and AI Studio code.
 * AI Studio code is synced via git subtree into src/ai-studio/.
 * 
 * Import from this file to access AI Studio functionality:
 *   import { Something } from "@/ai";
 * 
 * Or use the @ai/* alias for specific modules:
 *   import { foo } from "@ai/foo";
 */

export * from "./ai-studio";
