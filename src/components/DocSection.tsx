import React from "react";

interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
}

export function DocSection({ title, children, id }: DocSectionProps) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-foreground mb-4 text-2xl font-bold">{title}</h2>
      <div className="text-muted-foreground space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}
