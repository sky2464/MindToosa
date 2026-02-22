"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MicroStepsListProps {
  steps: string[];
}

export function MicroStepsList({ steps }: MicroStepsListProps) {
  const [expanded, setExpanded] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-zinc-400"
      >
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {steps.length} steps
      </button>
      {expanded && (
        <ol className="mt-1.5 space-y-1 pl-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-500">
              <span className="mt-0.5 shrink-0 font-mono text-zinc-700">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
