export const env = {
  AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
};

if (!env.AI_PROVIDER_API_KEY) {
  console.warn("Missing AI_PROVIDER_API_KEY in environment variables. AI features will not work.");
}
