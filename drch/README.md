This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

Deploy this frontend from repository root directory `drch`, not from the repository root.

Recommended Vercel settings:

- Root Directory: `drch`
- Framework Preset: Next.js
- Install Command: default `npm install`
- Build Command: `npm run build`
- Output Directory: default

Set these Vercel environment variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://<backend-host>
NEXT_PUBLIC_WS_BASE_URL=wss://<backend-host>
```

The FastAPI backend in `../main.py` uses WebSockets and should be deployed to a long-running ASGI host, not as a Vercel Function.
