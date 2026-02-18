---
name: Google GenAI Development
description: Guide for using the Google Generative AI SDK with Gemini models
---

# Google GenAI Development Guide

## 1. Setup

- **SDK**: `@google/generative-ai`
- **Key**: Requires `AI_PROVIDER_API_KEY` (or `GOOGLE_API_KEY`).

## 2. Client Initialization

- **Stateless Usage**: Initialize the client per request or as a singleton if strictly configuration-based.

  ```typescript
  import { GoogleGenerativeAI } from "@google/generative-ai";

  const genAI = new GoogleGenerativeAI(process.env.AI_PROVIDER_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  ```

## 3. Content Generation

- **Text-Only**:
  ```typescript
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  ```
- **JSON Mode**: Use `generationConfig: { responseMimeType: "application/json" }` for structured output.
  ```typescript
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: { responseMimeType: "application/json" },
  });
  ```

## 4. Safety Settings

- Always configure safety settings if user input is involved to prevent harmful output.
- Handle "blocked" responses gracefully (check `result.response.promptFeedback`).

## 5. Multimodal

- `generateContent` accepts arrays including images (base64) along with text.
