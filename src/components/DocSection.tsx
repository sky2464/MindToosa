import React from "react";

interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
}

export function DocSection({ title, children, id }: DocSectionProps) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-4 text-2xl font-bold text-foreground">{title}</h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}
