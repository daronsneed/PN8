import { z } from "zod";

// Image Generation Model options
export const ImageModelSchema = z.enum(["nano-banana", "gpt-image"]);
export type ImageModel = z.infer<typeof ImageModelSchema>;

// Image Generation - Request schema
export const GenerateImageRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  aspectRatio: z.enum(["auto", "1:1", "4:3", "16:9", "21:9", "9:19.5", "19.5:9", "9:16"]).optional().default("auto"),
  resolution: z.enum(["1K", "2K", "4K"]).optional().default("2K"),
  model: ImageModelSchema.optional().default("gpt-image"),
});

export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;

// Image Generation - Response schema
export const GenerateImageResponseSchema = z.object({
  imageData: z.string(), // base64 encoded image
  mimeType: z.string(),
});

export type GenerateImageResponse = z.infer<typeof GenerateImageResponseSchema>;

// Review Prompt - Request schema
export const ReviewPromptRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

export type ReviewPromptRequest = z.infer<typeof ReviewPromptRequestSchema>;

// Review Prompt - Response schema
export const ReviewPromptResponseSchema = z.object({
  suggestions: z.string(),
});

export type ReviewPromptResponse = z.infer<typeof ReviewPromptResponseSchema>;
