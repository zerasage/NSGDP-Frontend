"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUICK_QUESTIONS = [
  {
    q: "What is the malaria burden in Minna LGA?",
    a: "In 2024, Minna LGA reported approximately 1,980 severe malaria cases, with an incidence of 6.4 per 1,000 population. Chanchaga and Bida LGAs show the highest burdens statewide.",
  },
  {
    q: "Which LGAs have the highest meningitis cases?",
    a: "Top LGAs for meningitis in Niger State: Chanchaga (842 cases), Bida (691), Suleja (412), and Kontagora (378) in the 2024 surveillance period.",
  },
  {
    q: "How do I submit a dataset?",
    a: "Visit Submit Data at /submit or use the Data Portal dropdown. Complete the form with dataset metadata and upload your file (CSV, Excel, JSON, or GeoJSON). Submissions are reviewed within 3–5 working days.",
  },
  {
    q: "What health facilities are in Bida?",
    a: "Bida LGA has 4 registered facilities including Bida General Hospital, Bida Secondary Health Centre, and 2 PHCs. View them on the Facility Finder at /facilities.",
  },
  {
    q: "Show me diphtheria trends 2020–2024",
    a: "Diphtheria cases in Niger State rose from 142 (2020) to 287 (2024), with peaks during outbreak response periods. See the full trend on the Analytics Dashboard.",
  },
];

export function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const match = QUICK_QUESTIONS.find((q) => q.q === text);
    const reply =
      match?.a ??
      "This feature will be powered by the full AI backend in production. For now, try one of the quick questions below.";
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "assistant", text: reply },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3" suppressHydrationWarning>
      {open && (
        <div
          className="w-[min(100vw-2rem,380px)] rounded-xl border bg-background shadow-2xl flex flex-col max-h-[min(70vh,520px)]"
          role="dialog"
          aria-label="AI Assistant"
        >
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary text-primary-foreground rounded-t-xl">
            <span className="font-semibold text-sm">Health Data Assistant</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Hi! Ask me anything about Niger State health data…
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm rounded-lg px-3 py-2 max-w-[90%]",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="border-t p-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.q}
                  type="button"
                  onClick={() => sendMessage(q.q)}
                  className="text-xs rounded-full border px-2 py-1 hover:bg-muted transition-colors text-left"
                >
                  {q.q.length > 40 ? `${q.q.slice(0, 40)}…` : q.q}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="text-sm"
              />
              <Button type="submit" size="icon-sm" aria-label="Send message">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        suppressHydrationWarning
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
