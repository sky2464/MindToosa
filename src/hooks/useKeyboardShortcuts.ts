"use client";

import { useEffect, useCallback } from "react";

interface ShortcutDef {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    handler: () => void;
    /** If true, the shortcut won't fire when typing in an input/textarea */
    ignoreWhenTyping?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
    const handler = useCallback(
        (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;

            for (const s of shortcuts) {
                if (s.ignoreWhenTyping && isTyping) continue;

                const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
                const metaMatch = s.meta ? e.metaKey : true;
                const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
                const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();

                if (ctrlMatch && metaMatch && shiftMatch && keyMatch) {
                    e.preventDefault();
                    s.handler();
                    return;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handler]);
}
