import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, Sparkles, Copy, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Provider } from "@/lib/ai-config";
import { streamChatService, Message } from "@/lib/ai-service";

interface MinimalChatPanelProps {
  blueprintText: string;
  onBlueprintGenerated: (text: string) => void;
  initialPrompt?: string;
}

const CodeBlock = ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    if (preRef.current?.textContent) {
      await navigator.clipboard.writeText(preRef.current.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border/40 bg-[#1e1e1e]">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all border border-white/10 backdrop-blur-sm"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre 
        ref={preRef}
        className="overflow-auto max-h-[300px] w-full p-4 text-xs font-mono text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" 
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};

export function MinimalChatPanel({ blueprintText, onBlueprintGenerated, initialPrompt }: MinimalChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getActiveProvider = (): Provider | null => {
    try {
      const saved = localStorage.getItem('ai-providers');
      if (saved) {
        const providers = JSON.parse(saved) as Provider[];
        return providers.length > 0 ? providers[0] : null;
      }
    } catch (e) {
      console.error("Failed to load providers", e);
    }
    return null;
  };

  const streamChat = async (userMessages: Message[]) => {
    const provider = getActiveProvider();
    if (!provider) {
      toast.error("No AI provider configured. Please add one in Settings.");
      throw new Error("No provider");
    }

    let assistantContent = "";
    let lastExtractedBlueprint = "";
    
    try {
      await streamChatService(
        userMessages,
        provider,
        blueprintText,
        (chunk) => {
          assistantContent += chunk;
          updateLastMessage(assistantContent);

          // Real-time extraction
          const codeMatch = assistantContent.match(/```(?:blueprint|t3d)\s*\n([\s\S]*?)(?:```|$)/i) 
                         || assistantContent.match(/```\s*\n([\s\S]*?Begin Object[\s\S]*?)(?:```|$)/i);
                         
          if (codeMatch) {
              const code = codeMatch[1];
              // Only update if it looks like it started a blueprint and has changed
              if (code.includes("Begin Object") && code !== lastExtractedBlueprint) {
                  onBlueprintGenerated(code);
                  lastExtractedBlueprint = code;
              }
          } else if (assistantContent.includes("Begin Object")) {
               // Fallback for raw text
               const start = assistantContent.indexOf("Begin Object");
               const code = assistantContent.substring(start);
               if (code !== lastExtractedBlueprint) {
                   onBlueprintGenerated(code);
                   lastExtractedBlueprint = code;
               }
          }
        }
      );
    } catch (error) {
      console.error("Stream error:", error);
      toast.error("Failed to generate response");
      throw error;
    }

    // Extract blueprint code - support multiple formats
    let extractedBlueprint = "";
    
    // 1. Try to find code block with blueprint or t3d tag
    const codeBlockMatch = assistantContent.match(/```(?:blueprint|t3d)\s*\n([\s\S]*?)```/i);
    if (codeBlockMatch) {
      extractedBlueprint = codeBlockMatch[1].trim();
    } else {
      // 2. If not found, try to find any code block that looks like a blueprint
      const genericCodeMatch = assistantContent.match(/```\s*\n([\s\S]*?Begin Object[\s\S]*?End Object[\s\S]*?)```/i);
      if (genericCodeMatch) {
        extractedBlueprint = genericCodeMatch[1].trim();
      } else {
        // 3. If still not found, check if the message contains raw blueprint code
        const startIdx = assistantContent.indexOf("Begin Object");
        const endIdx = assistantContent.lastIndexOf("End Object");
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
           extractedBlueprint = assistantContent.substring(startIdx, endIdx + "End Object".length).trim();
        }
      }
    }

    if (extractedBlueprint) {
      onBlueprintGenerated(extractedBlueprint);
      toast.success("Blueprint updated from AI response");
    }
  };

  const updateLastMessage = (content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content } : m
        );
      }
      return [...prev, { role: "assistant", content }];
    });
  };


  const handleSend = async (text?: string) => {
    const content = typeof text === "string" ? text : input;
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      if (!(error instanceof Error && ["Rate limited", "Payment required"].includes(error.message))) {
        toast.error("AI error - please try again");
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true;
      handleSend(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  return (
    <div className="flex flex-col h-full bg-card/60 border-r border-border/40">
      {/* Header */}
      <div className="h-11 px-4 flex items-center gap-2 border-b border-border/40 bg-card/80">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">AI Assistant</h2>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center py-8 animate-fade-up">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/40 flex items-center justify-center">
              <Bot className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground/80">Blueprint AI</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
              Paste a blueprint and ask questions, or describe what you want to create.
            </p>
            
            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <button 
                onClick={() => handleSend("Create a simple player health system")}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                Create a player health system →
              </button>
              <button 
                onClick={() => handleSend("Explain this blueprint")}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                Explain this blueprint →
              </button>
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "animate-fade-up",
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-xl text-sm overflow-hidden",
                message.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-zinc-800/80 text-zinc-100 rounded-bl-sm border border-white/5"
              )}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none break-words prose-p:text-zinc-200 prose-headings:text-zinc-100 prose-strong:text-zinc-100">
                  <ReactMarkdown 
                    components={{
                      pre: CodeBlock,
                      code: ({node, className, ...props}) => (
                        <code 
                          className={cn("bg-black/30 rounded px-1 py-0.5 font-mono text-xs text-zinc-200", className)} 
                          {...props} 
                        />
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {message.content}
                </pre>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start animate-fade-up">
            <div className="chat-bubble-assistant flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/40 bg-card/80">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI about blueprints..."
            className="input-field flex-1"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              input.trim() 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}