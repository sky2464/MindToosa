'use client';

import React, { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen?: boolean;
}

export function FaqItem({ question, answer, isOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(isOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between bg-card hover:bg-secondary transition-colors text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground">{question}</span>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {open && (
        <div className="px-6 py-4 bg-background border-t border-border text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}
