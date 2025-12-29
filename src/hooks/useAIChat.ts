import { useState, useCallback, useRef } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FileEdit {
  action: "update" | "create" | "delete";
  path: string;
  content?: string;
}

interface UseAIChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, files: { path: string; content: string }[]) => Promise<FileEdit[] | null>;
  clearMessages: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-chat`;

export const useAIChat = (): UseAIChatResult => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string, 
    files: { path: string; content: string }[]
  ): Promise<FileEdit[] | null> => {
    const userMessage: ChatMessage = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          files: files.slice(0, 20), // Limit files to avoid token limits
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (newMessages[lastIdx]?.role === "assistant") {
                  newMessages[lastIdx] = { ...newMessages[lastIdx], content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            // Partial JSON, put back and wait
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse any file edits from the response
      const edits = parseEditsFromResponse(assistantContent);
      setIsLoading(false);
      return edits;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setIsLoading(false);
        return null;
      }
      console.error("AI chat error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
      return null;
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};

/**
 * Extract file edits from AI response
 */
function parseEditsFromResponse(content: string): FileEdit[] | null {
  // Look for JSON block with edits
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.edits && Array.isArray(parsed.edits)) {
      return parsed.edits as FileEdit[];
    }
  } catch {
    console.error("Failed to parse edits JSON");
  }

  return null;
}
