import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma";
import { env } from "./env";

export const auth = betterAuth({
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
        // Only send OTPs for sign-in right now.
        if (type !== "sign-in") return;

        // TODO: Replace with your email service (e.g., Resend, SendGrid, AWS SES)
        // Example with Resend:
        // await resend.emails.send({
        //   from: 'noreply@pn8.ai',
        //   to: email,
        //   subject: 'Your verification code',
        //   text: `Your code is: ${otp}`,
        // });
        console.log(`[EMAIL] OTP for ${email}: ${otp}`);
      },
    }),
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    disableCSRFCheck: true,
    // Cross-origin cookie settings for iframe web preview
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});
