"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/components/chat/chat-provider";
import { generateAssistantResponse } from "@/lib/chat-assistant";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { SUGGESTED_PROMPTS } from "@/types/chat";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Hi — I'm **LedgeLens Assistant**, your underwriting co-pilot.

Ask me about portfolio premium, submission readiness, contradictions, or any insured account in the pipeline.`,
  timestamp: new Date(),
};

function createId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 ? <br /> : null}
      </span>
    ));
  });
}

export function ChatWidget() {
  const { open, setOpen, toggle } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

      const response = generateAssistantResponse(trimmed);
      const assistantMsg: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    },
    [isTyping]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-[9999] flex flex-col overflow-hidden border border-border/60 bg-card shadow-2xl transition-all duration-300",
          "inset-x-0 bottom-0 h-[min(85vh,640px)] rounded-t-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[min(70vh,560px)] sm:w-[400px] sm:rounded-2xl",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
        role="dialog"
        aria-label="LedgeLens Assistant chat"
        aria-hidden={!open}
      >
        <div className="flex items-center gap-3 border-b border-border/60 bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">LedgeLens Assistant</p>
            <p className="text-xs text-primary-foreground/70">
              Prototype · Fictional data
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-primary-foreground hover:bg-primary-foreground/15"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="size-3.5" />
                  ) : (
                    <Bot className="size-3.5" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-muted/60 text-foreground"
                  )}
                >
                  {renderMarkdownLite(msg.content)}
                </div>
              </div>
            ))}

            {isTyping ? (
              <div className="flex gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="size-3.5" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {messages.length <= 1 && !isTyping ? (
          <div className="flex flex-wrap gap-2 border-t border-border/40 px-4 py-2">
            {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t border-border/60 p-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the portfolio…"
            rows={1}
            className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus-visible:ring-[3px]"
            aria-label="Chat message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <Send />
          </Button>
        </form>
      </div>

      {/* FAB — always on top */}
      {!open ? (
        <Button
          onClick={toggle}
          size="icon-lg"
          className="fixed right-4 bottom-4 z-[9999] size-14 animate-pulse rounded-full shadow-xl ring-4 ring-primary/20 hover:animate-none hover:scale-105 sm:right-6 sm:bottom-6"
          aria-label="Open LedgeLens Assistant"
        >
          <MessageCircle className="size-6" />
          <span className="sr-only">Open chat assistant</span>
        </Button>
      ) : null}
    </>,
    document.body
  );
}
