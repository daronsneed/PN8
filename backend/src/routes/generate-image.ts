import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { GenerateImageRequestSchema, type ImageModel } from "../types";

export const generateImageRouter = new Hono();

// Map aspect ratio to GPT Image size
function getGptImageSize(aspectRatio: string, resolution: string): string {
  // GPT Image 1.5 supports: "1024x1024", "1536x1024", "1024x1536", or "auto"
  // Map our aspect ratios to closest supported sizes

  if (aspectRatio === "auto") return "auto";

  // Square
  if (aspectRatio === "1:1") return "1024x1024";

  // Landscape ratios
  if (aspectRatio === "4:3" || aspectRatio === "16:9" || aspectRatio === "21:9" || aspectRatio === "19.5:9") {
    return "1536x1024";
  }

  // Portrait ratios
  if (aspectRatio === "9:19.5" || aspectRatio === "9:16") {
    return "1024x1536";
  }

  return "1024x1024";
}

// Map aspect ratio to Nano Banana format
function getNanoBananaAspectRatio(aspectRatio: string): string {
  // Nano Banana supports: "1:1", "16:9", "9:16"
  if (aspectRatio === "1:1") return "1:1";
  if (aspectRatio === "4:3" || aspectRatio === "16:9" || aspectRatio === "21:9" || aspectRatio === "19.5:9") return "16:9";
  if (aspectRatio === "9:19.5" || aspectRatio === "9:16") return "9:16";
  return "1:1"; // default for "auto"
}

// Generate image using GPT Image 1.5 (OpenAI)
async function generateWithGptImage(prompt: string, aspectRatio: string, resolution: string): Promise<{ imageData: string; mimeType: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const endpoint = "https://api.openai.com/v1/images/generations";
  const size = getGptImageSize(aspectRatio, resolution);

  // Map resolution to quality
  const quality = resolution === "4K" ? "high" : resolution === "1K" ? "low" : "medium";

  const requestBody = {
    model: "gpt-image-1.5",
    prompt: prompt,
    size: size,
    quality: quality,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`GPT Image generation failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    data?: Array<{
      b64_json?: string;
    }>;
  };

  const imageData = result.data?.[0]?.b64_json;
  if (!imageData) {
    console.error("Unexpected OpenAI API response structure:", JSON.stringify(result));
    throw new Error("Invalid response from GPT Image API");
  }

  return {
    imageData,
    mimeType: "image/png",
  };
}

// Generate image using Nano Banana Pro (Gemini)
async function generateWithNanoBanana(prompt: string, aspectRatio: string, resolution: string): Promise<{ imageData: string; mimeType: string }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
  const nanoBananaAspectRatio = getNanoBananaAspectRatio(aspectRatio);

  // Map resolution to imageSize for Nano Banana
  const imageSize = resolution; // "1K", "2K", or "4K"

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["Image"],
      imageConfig: {
        aspectRatio: nanoBananaAspectRatio,
        imageSize: imageSize,
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Nano Banana image generation failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            data?: string;
            mimeType?: string;
          };
        }>;
      };
    }>;
  };

  const candidate = result.candidates?.[0];
  const part = candidate?.content?.parts?.[0];
  const inlineData = part?.inlineData;

  if (!inlineData?.data || !inlineData?.mimeType) {
    console.error("Unexpected Gemini API response structure:", JSON.stringify(result));
    throw new Error("Invalid response from Nano Banana API");
  }

  return {
    imageData: inlineData.data,
    mimeType: inlineData.mimeType,
  };
}

// POST /api/generate-image - Generate an image using selected model
generateImageRouter.post(
  "/",
  zValidator("json", GenerateImageRequestSchema),
  async (c) => {
    const { prompt, aspectRatio, resolution, model } = c.req.valid("json");

    try {
      let result: { imageData: string; mimeType: string };

      if (model === "nano-banana") {
        result = await generateWithNanoBanana(prompt, aspectRatio, resolution);
      } else {
        // Default to GPT Image 1.5
        result = await generateWithGptImage(prompt, aspectRatio, resolution);
      }

      return c.json({
        data: {
          imageData: result.imageData,
          mimeType: result.mimeType,
        },
      });
    } catch (error) {
      console.error("Image generation error:", error);

      const message = error instanceof Error ? error.message : "Unknown error";
      const isConfigError = message.includes("not configured");

      return c.json(
        {
          error: {
            message,
            code: isConfigError ? "CONFIG_ERROR" : "API_ERROR",
          },
        },
        isConfigError ? 500 : 400
      );
    }
  }
);
