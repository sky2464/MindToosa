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

export function ContactCard({ icon: Icon, title, description, href, external, ariaLabel }: ContactCardProps) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" aria-label={ariaLabel || title} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );

  if (!href) {
    return (
      <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block p-6 bg-card border border-border rounded-lg hover:border-primary hover:bg-secondary transition-colors group"
      aria-label={ariaLabel || title}
    >
      {content}
    </a>
  );
}
