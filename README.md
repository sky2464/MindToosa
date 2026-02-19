# MindToosa

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🐳 Docker Deployment

This project includes a best-practice, multi-stage Docker setup for both development and production.

### Development (Hot Module Replacement)

Run the app inside a container with live code syncing:

```bash
docker compose -f docker-compose.dev.yml up --build
```

The app will be accessible at [http://localhost:3001](http://localhost:3001).

### Production

Build and run the optimized standalone production image:

```bash
# Build the image
docker build -t mindtoosa:latest .

# Run the container (Recommended via Compose)
docker compose up -d
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

### Manual Run (Docker Run)

If you prefer to run the container without Docker Compose, ensure you pass the environment variables and map the port:

```bash
docker run -p 3000:3000 --env-file .env.local mindtoosa:latest
```

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
