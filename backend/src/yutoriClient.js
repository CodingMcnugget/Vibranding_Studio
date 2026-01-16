import fetch from "node-fetch";

const DEFAULT_API_BASE = "https://api.yutori.com/v1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default class YutoriClient {
  constructor({ apiKey, apiBase = DEFAULT_API_BASE, userAgent } = {}) {
    if (!apiKey) {
      throw new Error("YUTORI_API_KEY is required");
    }
    this.apiKey = apiKey;
    this.apiBase = apiBase.replace(/\/+$/, "");
    this.userAgent = userAgent || "yutori-asset-scraper/0.1";
  }

  async createBrowsingTask({ task, startUrl, requireAuth = false }) {
    const resp = await fetch(`${this.apiBase}/browsing/tasks`, {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        "User-Agent": this.userAgent
      },
      body: JSON.stringify({
        task,
        start_url: startUrl,
        require_auth: requireAuth
      })
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`createBrowsingTask failed: ${resp.status} ${text}`);
    }
    return JSON.parse(text);
  }

  async getBrowsingTask(taskId) {
    const resp = await fetch(`${this.apiBase}/browsing/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "X-API-KEY": this.apiKey,
        "User-Agent": this.userAgent
      }
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`getBrowsingTask failed: ${resp.status} ${text}`);
    }
    return JSON.parse(text);
  }

  async runBrowsingTaskAndWait({
    task,
    startUrl,
    requireAuth = false,
    pollIntervalMs = 2500,
    timeoutMs = 120000
  }) {
    const created = await this.createBrowsingTask({ task, startUrl, requireAuth });
    const taskId = created?.id || created?.task_id || created?.data?.id;
    if (!taskId) {
      throw new Error("Browsing task id not found in create response");
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getBrowsingTask(taskId);
      const state =
        status?.status ||
        status?.state ||
        status?.data?.status ||
        status?.data?.state;

      if (state && ["completed", "succeeded", "success", "finished"].includes(state)) {
        return status;
      }
      if (state && ["failed", "error", "cancelled"].includes(state)) {
        throw new Error(`Browsing task failed with state: ${state}`);
      }

      await sleep(pollIntervalMs);
    }

    throw new Error("Browsing task timed out");
  }
}
