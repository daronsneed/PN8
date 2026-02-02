import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { env } from "./env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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

        if (resend) {
          await resend.emails.send({
            from: "PN8 <noreply@pn8.ai>",
            to: email,
            subject: "Your PN8 verification code",
            text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
                <h2 style="color: #333;">Your verification code</h2>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000;">${otp}</p>
                <p style="color: #666;">This code expires in 5 minutes.</p>
              </div>
            `,
          });
          console.log(`[EMAIL] OTP sent to ${email}`);
        } else {
          // Fallback for local development without Resend
          console.log(`[EMAIL] OTP for ${email}: ${otp}`);
        }
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
