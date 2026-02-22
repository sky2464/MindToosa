"use client";

import React, { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen?: boolean;
}

export function FaqItem({ question, answer, isOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(isOpen);

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="bg-card hover:bg-secondary flex w-full items-center justify-between px-6 py-4 text-left transition-colors"
        aria-expanded={open}
      >
        <span className="text-foreground font-semibold">{question}</span>
        <svg
          className={`text-muted-foreground h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
      {open && (
        <div className="bg-background border-border text-muted-foreground border-t px-6 py-4">
          {answer}
        </div>
      )}
    </div>
  );
}
