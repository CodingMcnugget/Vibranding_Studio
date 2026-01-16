import "dotenv/config";
import express from "express";
import YutoriClient from "./yutoriClient.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const client = new YutoriClient({
  apiKey: process.env.YUTORI_API_KEY,
  apiBase: process.env.YUTORI_API_BASE,
  userAgent: process.env.USER_AGENT
});

const defaultPrompt = (url) => `
Visit the page and extract as many assets as possible. Requirements:
- Wait for the page to load fully, scroll to the bottom, and capture lazy-loaded items.
- Return absolute URLs only.
- Output JSON ONLY with the following fields:
  {
    "page_url": string,
    "title": string,
    "meta": { [key: string]: string },
    "open_graph": { [key: string]: string },
    "headings": string[],
    "text_blocks": string[],
    "links": [{ "url": string, "text": string }],
    "images": [{ "url": string, "alt": string, "width": number|null, "height": number|null }],
    "image_srcsets": string[],
    "videos": [{ "url": string, "poster": string }],
    "audio": [{ "url": string }],
    "scripts": string[],
    "stylesheets": string[],
    "favicons": string[],
    "assets": [{ "type": string, "url": string }],
    "notes": string[]
  }
Page URL: ${url}
`;

const tryParseJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    return null;
  }
};

const extractOutput = (taskResult) => {
  const candidates = [
    taskResult?.output,
    taskResult?.result,
    taskResult?.response,
    taskResult?.data?.output,
    taskResult?.data?.result,
    taskResult?.data?.response
  ];
  for (const item of candidates) {
    const parsed = tryParseJson(item);
    if (parsed) return parsed;
  }
  return {
    raw: taskResult
  };
};

const normalizeList = (items) =>
  Array.from(
    new Set(
      (items || [])
        .map((item) => (typeof item === "string" ? item.trim() : null))
        .filter(Boolean)
    )
  );

app.post("/assets", async (req, res) => {
  const { url, requireAuth, pollIntervalMs, timeoutMs } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }

  try {
    const taskResult = await client.runBrowsingTaskAndWait({
      task: defaultPrompt(url),
      startUrl: url,
      requireAuth: Boolean(requireAuth),
      pollIntervalMs: Number(pollIntervalMs) || 2500,
      timeoutMs: Number(timeoutMs) || 120000
    });

    const output = extractOutput(taskResult);
    if (output.assets) {
      output.assets = output.assets.filter((asset) => asset?.url);
    }
    if (output.images) {
      output.images = output.images.filter((img) => img?.url);
    }
    if (output.links) {
      output.links = output.links.filter((link) => link?.url);
    }

    output.image_srcsets = normalizeList(output.image_srcsets);
    output.scripts = normalizeList(output.scripts);
    output.stylesheets = normalizeList(output.stylesheets);
    output.favicons = normalizeList(output.favicons);

    return res.json({
      ok: true,
      data: output
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
