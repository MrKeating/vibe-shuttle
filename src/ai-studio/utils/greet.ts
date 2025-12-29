/**
 * Sample utility function to verify AI Studio bridge imports work correctly.
 * 
 * Usage:
 *   import { greet } from "@/ai";
 *   import { greet } from "@ai/utils/greet";
 */

export function greet(name: string): string {
  return `Hello, ${name}! This message comes from AI Studio.`;
}

export function getAIStudioInfo() {
  return {
    source: "ai-studio",
    syncMethod: "git subtree",
    folderPath: "src/ai-studio/",
  };
}
