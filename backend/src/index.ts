import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { sampleRouter } from "./routes/sample";
import { promptsRouter } from "./routes/prompts";
import { generateImageRouter } from "./routes/generate-image";
import { reviewPromptRouter } from "./routes/review-prompt";
import { scenePresetsRouter } from "./routes/scene-presets";
import { logger } from "hono/logger";

// Type the Hono app with user/session variables
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware - validates origin against allowlist
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

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Auth middleware - populates user/session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Mount auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Get current user
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);
  return c.json({ data: user });
});

// Auto-login for returning verified users
app.post("/api/auto-login", async (c) => {
  try {
    const { email } = await c.req.json();
    console.log("Auto-login attempt for:", email);

    if (!email || typeof email !== "string") {
      console.log("Invalid email provided");
      return c.json({ data: { canAutoLogin: false } });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists and has been verified
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    console.log("User found:", user ? { id: user.id, email: user.email, verified: user.emailVerified } : null);

    if (!user || !user.emailVerified) {
      console.log("User not found or not verified");
      return c.json({ data: { canAutoLogin: false } });
    }

    // Generate a one-time code for auto-login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Better Auth uses format: ${type}-otp-${email}
    const identifier = `sign-in-otp-${normalizedEmail}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this identifier first
    await prisma.verification.deleteMany({
      where: { identifier },
    });

    // Store the OTP in the verification table with Better Auth's expected format
    // Better Auth stores value as `${otp}:${attemptCount}`
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        value: `${otp}:0`,
        expiresAt,
      },
    });

    console.log("Auto-login OTP generated:", otp, "for identifier:", identifier);

    return c.json({
      data: {
        canAutoLogin: true,
        otp, // Return OTP to frontend for auto-verification
      }
    });
  } catch (error) {
    console.error("Auto-login error:", error);
    return c.json({ data: { canAutoLogin: false } });
  }
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/prompts", promptsRouter);
app.route("/api/generate-image", generateImageRouter);
app.route("/api/review-prompt", reviewPromptRouter);
app.route("/api/scene-presets", scenePresetsRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
