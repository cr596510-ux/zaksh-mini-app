import http from "node:http";
import { URL } from "node:url";

import { initDatabase } from "./db.js";
import { validateTelegramInitData } from "./auth.js";
import {
  createOrUpdateUser,
  findUserByTelegramId
} from "./userService.js";
import {
  startMining,
  completeMining
} from "./miningService.js";
import {
  getActiveTasks,
  claimTask
} from "./taskService.js";
import {
  createReferral,
  getReferralStats
} from "./referralService.js";
import { getWallet } from "./walletService.js";
import { createWithdrawal } from "./withdrawalService.js";
import { seedTasks } from "./taskSeed.js";
import { rateLimit } from "./rateLimit.js";

const PORT = Number(process.env.PORT) || 3000;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (raw.length > 1024 * 1024) {
    throw new Error("Request body is too large.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

function getTelegramInitData(req) {
  const value = req.headers["x-telegram-init-data"];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Telegram authentication is required.");
  }

  return value;
}

async function authenticate(req) {
  const initData = getTelegramInitData(req);
  const telegramUser = validateTelegramInitData(initData);

  return createOrUpdateUser(telegramUser);
}

async function handleRequest(req, res) {
  const requestUrl = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = requestUrl.pathname;

  const rateKey =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";

  const limit = rateLimit(String(rateKey));

  if (!limit.allowed) {
    res.setHeader(
      "Retry-After",
      String(limit.retryAfterSeconds)
    );

    sendJson(res, 429, {
      ok: false,
      error: "Too many requests.",
      retryAfterSeconds: limit.retryAfterSeconds
    });

    return;
  }

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "ZAKSH Backend",
      status: "running"
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/tasks") {
    const user = await authenticate(req);
    const tasks = await getActiveTasks();

    sendJson(res, 200, {
      ok: true,
      userId: user.id,
      tasks
    });

    return;
  }

  if (req.method === "GET" && pathname === "/api/me") {
    const user = await authenticate(req);

    sendJson(res, 200, {
      ok: true,
      user
    });

    return;
  }

  if (req.method === "GET" && pathname === "/api/wallet") {
    const user = await authenticate(req);
    const wallet = await getWallet(user.id);

    sendJson(res, 200, {
      ok: true,
      wallet
    });

    return;
  }

  if (req.method === "GET" && pathname === "/api/referrals") {
    const user = await authenticate(req);
    const stats = await getReferralStats(user.id);

    sendJson(res, 200, {
      ok: true,
      stats
    });

    return;
  }

  if (req.method === "POST" && pathname === "/api/mining/start") {
    const user = await authenticate(req);
    const result = await startMining(user.id);

    sendJson(res, 200, {
      ok: true,
      mining: result
    });

    return;
  }

  if (req.method === "POST" && pathname === "/api/mining/complete") {
    const user = await authenticate(req);
    const body = await readJsonBody(req);

    const sessionId = Number(body.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      throw new Error("Valid mining session ID is required.");
    }

    const result = await completeMining(
      user.id,
      sessionId
    );

    sendJson(res, 200, {
      ok: true,
      mining: result
    });

    return;
  }

  if (req.method === "POST" && pathname === "/api/tasks/claim") {
    const user = await authenticate(req);
    const body = await readJsonBody(req);

    const taskId = Number(body.taskId);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new Error("Valid task ID is required.");
    }

    const result = await claimTask(
      user.id,
      taskId
    );

    sendJson(res, 200, {
      ok: true,
      task: result
    });

    return;
  }

  if (req.method === "POST" && pathname === "/api/referrals") {
    const user = await authenticate(req);
    const body = await readJsonBody(req);

    const inviterTelegramId =
      String(body.inviterTelegramId || "").trim();

    if (!inviterTelegramId) {
      throw new Error(
        "Inviter Telegram ID is required."
      );
    }

    const inviter =
      await findUserByTelegramId(inviterTelegramId);

    if (!inviter) {
      throw new Error("Inviter was not found.");
    }

    const result = await createReferral(
      inviter.id,
      user.id
    );

    sendJson(res, 200, {
      ok: true,
      referral: result
    });

    return;
  }

  if (
    req.method === "POST" &&
    pathname === "/api/withdrawals"
  ) {
    const user = await authenticate(req);
    const body = await readJsonBody(req);

    const amount = Number(body.amount);
    const destination =
      String(body.destination || "").trim();

    const result = await createWithdrawal(
      user.id,
      amount,
      destination
    );

    sendJson(res, 201, {
      ok: true,
      withdrawal: result
    });

    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "Not Found"
  });
}

const server = http.createServer(
  async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (error) {
      console.error(error);

      const statusCode =
        error.message?.includes("authentication")
          ? 401
          : 400;

      sendJson(res, statusCode, {
        ok: false,
        error: error.message || "Internal server error."
      });
    }
  }
);

async function start() {
  await initDatabase();
  await seedTasks();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `ZAKSH Backend listening on port ${PORT}`
    );
  });
}

start().catch((error) => {
  console.error(
    "Failed to start ZAKSH Backend:",
    error
  );

  process.exit(1);
});
