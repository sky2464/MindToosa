import React from "react";
import { LucideIcon } from "lucide-react";

interface ContactCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  external?: boolean;
  ariaLabel?: string;
}

export function ContactCard({
  icon: Icon,
  title,
  description,
  href,
  external,
  ariaLabel,
}: ContactCardProps) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0">
        <Icon className="text-primary h-6 w-6" aria-label={ariaLabel || title} />
      </div>
      <div className="flex-1">
        <h3 className="text-foreground mb-1 font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );

  if (!href) {
    return (
      <div className="bg-card border-border hover:border-primary/50 rounded-lg border p-6 transition-colors">
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="bg-card border-border hover:border-primary hover:bg-secondary group block rounded-lg border p-6 transition-colors"
      aria-label={ariaLabel || title}
    >
      {content}
    </a>
  );
}
