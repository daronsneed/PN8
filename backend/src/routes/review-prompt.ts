import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ReviewPromptRequestSchema } from "../types";

const reviewPromptRouter = new Hono();

reviewPromptRouter.post(
  "/",
  zValidator("json", ReviewPromptRequestSchema),
  async (c) => {
    const { prompt } = c.req.valid("json");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key not configured", code: "MISSING_API_KEY" } },
        500
      );
    }

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          input: `You are an expert at writing prompts for AI image generation. Review this prompt and provide 3-5 specific, actionable suggestions to improve it for better image generation results. Focus on clarity, detail, composition, lighting, and style. Be concise.

Prompt to review:
${prompt}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenAI API error:", errorData);
        return c.json(
          { error: { message: "Failed to review prompt", code: "OPENAI_ERROR" } },
          500
        );
      }

      const data = await response.json() as { output?: { content?: { text?: string }[] }[] };
      // Extract text from OpenAI responses API structure
      const suggestions = data.output?.[0]?.content?.[0]?.text || "";

      if (!suggestions) {
        console.error("No suggestions in OpenAI response:", JSON.stringify(data, null, 2));
        return c.json(
          { error: { message: "No suggestions returned from AI", code: "EMPTY_RESPONSE" } },
          500
        );
      }

      return c.json({ data: { suggestions } });
    } catch (error) {
      console.error("Error reviewing prompt:", error);
      return c.json(
        { error: { message: "Failed to review prompt", code: "INTERNAL_ERROR" } },
        500
      );
    }
  }
);

export { reviewPromptRouter };
