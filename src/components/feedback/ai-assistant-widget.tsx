"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  streamAssistantChat,
  type AssistantSourceLink,
} from "@/lib/api/assistant";
import { ApiError } from "@/lib/api/client";

/** Chips always go to the live assistant (except pure how-to FAQs). */
const QUICK_QUESTIONS = [
  "What datasets are on the portal?",
  "Summarise the health data dashboard",
  "Which LGAs have the highest malaria burden?",
  "Which health facilities are in Bida?",
  "How do I submit a dataset?",
];

/**
 * Navigation / how-to answers that do not need Claude — keep these short and
 * link to real portal routes. Anything about counts, burdens, or facilities
 * must NOT be listed here (those go to /ai/chat).
 */
const LOCAL_FAQ: Array<{ match: RegExp; answer: string; links?: AssistantSourceLink[] }> = [
  {
    match: /how (do i|to) submit|upload (a )?dataset|contribute data/i,
    answer:
      "To submit a dataset: sign in, open Contribute Data / Upload at /upload (or Submit Data from the menu), fill in the metadata, then attach CSV, Excel, JSON, or GeoPackage. Your organisation’s submission goes to admin review before it appears on the public catalogue.",
    links: [{ label: "Upload", href: "/upload" }],
  },
  {
    match: /analytics page|where.*(analytics|dashboard)|find.*(analytics|trends)/i,
    answer:
      "Open Analytics for health indicators, ward-level burden, and programme monitoring. The home page also surfaces key portal stats.",
    links: [{ label: "Analytics", href: "/analytics" }],
  },
  {
    match: /how (do i|to) (find|search) (a )?dataset|data portal|browse datasets/i,
    answer:
      "Browse and search published datasets at the Data Portal. Use filters and search, then open a dataset for preview and download (restricted datasets need an approved access request).",
    links: [{ label: "Data Portal", href: "/dataportal" }],
  },
  {
    match: /document library|find (a )?document|sops?|policies/i,
    answer:
      "Published documents (SOPs, policies, reports) are in the Document Library. Organisation users can also manage uploads under Dashboard → My documents.",
    links: [
      { label: "Documents", href: "/documents" },
      { label: "My documents", href: "/dashboard/documents" },
    ],
  },
  {
    match: /facilit(y|ies) (map|finder)|where.*facilit/i,
    answer:
      "Use the facility map / finder on the portal (Facilities). You can also ask me for facilities in a specific LGA (e.g. “facilities in Bida”) and I’ll look them up from the registry.",
    links: [{ label: "Facilities", href: "/facilities" }],
  },
];

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  links?: AssistantSourceLink[];
};

function newConversationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}`;
}

function localFaqAnswer(text: string): { answer: string; links?: AssistantSourceLink[] } | null {
  for (const item of LOCAL_FAQ) {
    if (item.match.test(text)) {
      return { answer: item.answer, links: item.links };
    }
  }
  return null;
}

function SourceLinks({ links }: { links: AssistantSourceLink[] }) {
  if (!links.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border bg-background px-2 py-0.5 text-xs font-medium text-primary hover:bg-muted"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [conversationId] = useState(newConversationId);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setStatusText(null);

    const faq = localFaqAnswer(trimmed);
    if (faq) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: faq.answer, links: faq.links },
      ]);
      return;
    }

    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    try {
      const history = nextMessages.slice(-12).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      await streamAssistantChat(
        { messages: history, conversationId },
        (event) => {
          if (event.type === "delta") {
            setStatusText(null);
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = {
                  ...last,
                  text: last.text + event.text,
                };
              }
              return copy;
            });
          } else if (event.type === "status") {
            setStatusText(event.text);
          } else if (event.type === "done") {
            setStatusText(null);
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = {
                  role: "assistant",
                  text: event.reply || last.text,
                  links: event.links,
                };
              }
              return copy;
            });
          } else if (event.type === "error") {
            setStatusText(null);
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = {
                  role: "assistant",
                  text: `${event.message} You can still browse /dataportal, /analytics, and /facilities.`,
                };
              }
              return copy;
            });
          }
        },
        controller.signal,
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong talking to the assistant.";
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && !last.text) {
          copy[copy.length - 1] = {
            role: "assistant",
            text: `${message} You can still browse /dataportal, /analytics, and /facilities.`,
          };
        } else {
          copy.push({
            role: "assistant",
            text: `${message} You can still browse /dataportal, /analytics, and /facilities.`,
          });
        }
        return copy;
      });
    } finally {
      setLoading(false);
      setStatusText(null);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3"
      suppressHydrationWarning
    >
      {open && (
        <div
          className="flex max-h-[min(70vh,520px)] w-[min(100vw-2rem,380px)] flex-col rounded-xl border bg-background shadow-2xl"
          role="dialog"
          aria-label="AI Assistant"
        >
          <div className="flex items-center justify-between rounded-t-xl border-b bg-primary px-4 py-3 text-primary-foreground">
            <span className="text-sm font-semibold">Health Data Assistant</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Hi! Ask about Niger State health datasets, facilities, disease
                burden, or portal analytics. How-to questions are answered
                instantly; data questions use live portal tools.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground whitespace-pre-wrap"
                    : "bg-muted text-foreground",
                )}
              >
                {m.role === "assistant" && !m.text && loading ? (
                  <span className="text-muted-foreground">…</span>
                ) : (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                )}
                {m.role === "assistant" && m.links?.length ? (
                  <SourceLinks links={m.links} />
                ) : null}
              </div>
            ))}
            {loading && statusText && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {statusText}
              </div>
            )}
          </div>
          <div className="space-y-2 border-t p-3">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(q)}
                    className="rounded-full border px-2 py-1 text-left text-xs transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {q.length > 40 ? `${q.slice(0, 40)}…` : q}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon-sm"
                aria-label="Send message"
                disabled={loading || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="size-12 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
