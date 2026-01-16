# Backend

Fastify + TypeScript server that calls Yutori Browsing API to extract rich assets
from a given URL.

## Setup

Set env vars before running:

- `YUTORI_API_KEY` (required)
- `YUTORI_API_BASE` (optional, default `https://api.yutori.com/v1`)
- `PORT` (optional, default `3000`)

## Run

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
pnpm start
```

## Usage

```bash
curl -X POST http://localhost:3000/assets \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```
