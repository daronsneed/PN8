import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { z } from "zod";

// Environment
const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  BACKEND_URL: process.env.BACKEND_URL || "https://pn8.ai",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};

// Prisma with Neon adapter
const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Resend
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Auth
const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  trustedOrigins: [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://pn8.ai",
    "https://www.pn8.ai",
    "https://*.pn8.ai",
    "https://*.vibecode.run",
    "https://*.dev.vibecode.run",
    "https://*.vibecodeapp.com",
    env.BACKEND_URL,
  ].filter(Boolean),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return;
        if (resend) {
          try {
            const result = await resend.emails.send({
              from: "PN8 <daron@mail.pn8.ai>",
              to: email,
              subject: "Your PN8 verification code",
              text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
              html: `<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
                <h2 style="color: #333;">Your verification code</h2>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000;">${otp}</p>
                <p style="color: #666;">This code expires in 5 minutes.</p>
              </div>`,
            });
            console.log(`[EMAIL] OTP sent to ${email}`, result);
          } catch (error) {
            console.error(`[EMAIL] Failed to send OTP to ${email}:`, error);
            console.log(`[EMAIL] OTP for ${email}: ${otp}`);
          }
        } else {
          console.log(`[EMAIL] RESEND_API_KEY not set - OTP for ${email}: ${otp}`);
        }
      },
    }),
  ],
  advanced: {
    crossSubDomainCookies: { enabled: true },
    disableCSRFCheck: true,
    defaultCookieAttributes: { sameSite: "none", secure: true, partitioned: true },
  },
});

// App
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/pn8\.ai$/,
  /^https:\/\/www\.pn8\.ai$/,
  /^https:\/\/[a-z0-9-]+\.pn8\.ai$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
];
app.use("*", cors({
  origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
  credentials: true,
}));

// Auth middleware
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

// Auth routes
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health
app.get("/health", (c) => c.json({ status: "ok" }));

// Me
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);
  return c.json({ data: user });
});

// Auto-login
app.post("/api/auto-login", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || typeof email !== "string") return c.json({ data: { canAutoLogin: false } });
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.emailVerified) return c.json({ data: { canAutoLogin: false } });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `sign-in-otp-${normalizedEmail}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.verification.deleteMany({ where: { identifier } });
    await prisma.verification.create({
      data: { id: crypto.randomUUID(), identifier, value: `${otp}:0`, expiresAt },
    });
    return c.json({ data: { canAutoLogin: true, otp } });
  } catch (error) {
    console.error("Auto-login error:", error);
    return c.json({ data: { canAutoLogin: false } });
  }
});

// Prompts routes
app.get("/api/prompts", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const prompts = await prisma.savedPrompt.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return c.json({ data: prompts });
});

app.post("/api/prompts", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const body = await c.req.json();
  const prompt = await prisma.savedPrompt.create({
    data: { ...body, userId: user.id },
  });
  return c.json({ data: prompt });
});

app.put("/api/prompts/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const id = c.req.param("id");
  const body = await c.req.json();
  const prompt = await prisma.savedPrompt.update({
    where: { id, userId: user.id },
    data: body,
  });
  return c.json({ data: prompt });
});

app.delete("/api/prompts/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const id = c.req.param("id");
  await prisma.savedPrompt.delete({ where: { id, userId: user.id } });
  return c.body(null, 204);
});

// Scene presets routes
app.get("/api/scene-presets", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const presets = await prisma.scenePreset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: presets });
});

app.post("/api/scene-presets", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const body = await c.req.json();
  const preset = await prisma.scenePreset.create({
    data: { ...body, userId: user.id },
  });
  return c.json({ data: preset });
});

app.delete("/api/scene-presets/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const id = c.req.param("id");
  await prisma.scenePreset.delete({ where: { id, userId: user.id } });
  return c.body(null, 204);
});

// Sample route
app.get("/api/sample", (c) => c.json({ data: { message: "Hello from PN8 API!", timestamp: new Date().toISOString() } }));

export default handle(app);
