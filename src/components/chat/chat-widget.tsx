"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/components/chat/chat-provider";
import { generateAssistantResponse } from "@/lib/chat-assistant";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { SUGGESTED_PROMPTS } from "@/types/chat";

function createWelcomeMessage(): ChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: "assistant",
    content: `Hi — I'm **LedgeLens Assistant**, your underwriting co-pilot.

Ask me about portfolio premium, submission readiness, contradictions, or any insured account in the pipeline.`,
    timestamp: new Date(),
  };
}

function createId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatMessageTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showSuggestions =
    messages.length <= 1 && !isTyping;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const resetConversation = useCallback(() => {
    if (isTyping) return;
    setMessages([createWelcomeMessage()]);
    setInput("");
    scrollToTop();
    inputRef.current?.focus();
  }, [isTyping, scrollToTop]);

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

      await new Promise((r) => setTimeout(r, 500 + Math.random() * 350));

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
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close chat"
        className={cn(
          "fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 sm:bg-black/10",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-[9999] flex flex-col overflow-hidden border border-border/50 bg-card shadow-2xl transition-all duration-300 ease-out",
          "inset-x-0 bottom-0 h-[min(88vh,680px)] rounded-t-3xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[min(72vh,600px)] sm:w-[420px] sm:rounded-2xl",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        )}
        role="dialog"
        aria-label="LedgeLens Assistant chat"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-border/40 bg-gradient-to-r from-primary to-[oklch(0.48_0.11_220)] px-4 py-3.5 text-primary-foreground">
          <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold leading-tight">LedgeLens Assistant</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Online
                </span>
              </div>
              <p className="text-xs text-primary-foreground/75">
                Portfolio Q&A · Prototype data
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-primary-foreground hover:bg-white/15"
                onClick={resetConversation}
                disabled={isTyping}
                aria-label="Reset conversation"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-primary-foreground hover:bg-white/15"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X className="size-3.5" />
                <span className="hidden sm:inline">Close</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        >
          <div className="space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/50 bg-background text-muted-foreground"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="size-4" />
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex max-w-[82%] flex-col gap-1",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "rounded-tr-md bg-primary text-primary-foreground"
                        : "rounded-tl-md border border-border/40 bg-muted/40 text-foreground"
                    )}
                  >
                    {renderMarkdownLite(msg.content)}
                  </div>
                  <span className="px-1 text-[10px] text-muted-foreground">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isTyping ? (
              <div className="flex gap-3">
                <div className="flex size-8 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-sm">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border/40 bg-muted/40 px-4 py-3 shadow-sm">
                  <span className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:0ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:150ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Suggested prompts */}
        {showSuggestions ? (
          <div className="shrink-0 border-t border-border/40 bg-muted/20 px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-left text-xs text-foreground/80 shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground hover:shadow"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              {messages.length - 1} message{messages.length - 1 !== 1 ? "s" : ""}{" "}
              in this conversation
            </p>
            <button
              type="button"
              onClick={resetConversation}
              disabled={isTyping}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              Start new chat
            </button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border/60 bg-background p-3"
        >
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about premium, readiness, contradictions…"
                rows={1}
                className="max-h-28 min-h-10 w-full resize-none rounded-xl border border-input bg-muted/30 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:ring-[3px] focus:ring-primary/15"
                aria-label="Chat message"
              />
              <p className="mt-1.5 hidden text-[10px] text-muted-foreground sm:block">
                Press Enter to send · Shift+Enter for new line · Esc to close
              </p>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="size-10 shrink-0 rounded-xl shadow-sm"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* FAB */}
      {!open ? (
        <Button
          onClick={toggle}
          size="icon-lg"
          className="fixed right-4 bottom-4 z-[9999] size-14 rounded-full bg-gradient-to-br from-primary to-[oklch(0.48_0.11_220)] shadow-xl ring-4 ring-primary/25 transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
          aria-label="Open LedgeLens Assistant"
        >
          <MessageCircle className="size-6" />
        </Button>
      ) : null}
    </>,
    document.body
  );
}
