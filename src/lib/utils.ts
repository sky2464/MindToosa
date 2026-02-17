import { twMerge } from "tailwind-merge";

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

function clsx(...inputs: ClassValue[]): string {
    const classes: string[] = [];

    for (const input of inputs) {
        if (!input) continue;

        if (typeof input === "string" || typeof input === "number") {
            classes.push(input.toString());
        } else if (Array.isArray(input)) {
            const inner = clsx(...input);
            if (inner) classes.push(inner);
        } else if (typeof input === "object") {
            for (const key in input) {
                if (input[key]) {
                    classes.push(key);
                }
            }
        }
    }

    return classes.join(" ");
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(...inputs));
}
