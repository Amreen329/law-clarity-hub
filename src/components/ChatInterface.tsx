import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import type { ChatMessage } from "@/lib/analysisTypes";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  documentName: string;
  documentText: string;
}

const ChatInterface = ({ documentName, documentText }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `I've analyzed **${documentName}**. Ask me anything about this document — I'll explain it in simple terms!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (will be replaced with Lovable AI when Cloud is enabled)
    setTimeout(() => {
      const responses = [
        `Based on the document, here's what I found regarding your question:\n\nThe document addresses this topic in several sections. The key points are:\n\n1. **Relevant provisions** exist that directly relate to your query\n2. **Implementation timeline** is typically 90 days after enactment\n3. **Citizen rights** are protected under the accountability framework\n\nWould you like me to go deeper into any specific aspect?`,
        `Great question! Let me break this down simply:\n\n• The law creates new protections for citizens in this area\n• Government agencies must comply within a set timeframe\n• There are penalties for non-compliance\n• You can file complaints if your rights aren't respected\n\nThe most important thing to know is that this strengthens your rights as a citizen.`,
        `Here's what the document says about this:\n\nThe relevant section establishes a clear framework. In plain language, it means the government must be more transparent and responsive. Officials who don't follow these rules face consequences.\n\n**Key takeaway:** This is designed to benefit ordinary citizens by making government processes simpler and more accountable.`,
      ];
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responses[Math.floor(Math.random() * responses.length)] },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-[500px] flex-col rounded-xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Ask About This Document</h3>
        <p className="text-xs text-muted-foreground">Get plain-language answers about {documentName}</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-civic-teal/15">
                <Bot className="h-4 w-4 text-civic-teal" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground"
              }`}
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-civic-amber/15">
                <User className="h-4 w-4 text-civic-amber" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-civic-teal/15">
              <Bot className="h-4 w-4 text-civic-teal" />
            </div>
            <div className="rounded-xl bg-muted/50 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question about this document..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-civic-navy-light disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
