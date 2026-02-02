import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";

// Type for context with user/session
type AuthContext = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const promptsRouter = new Hono<AuthContext>();

// Schema for creating/updating a prompt
const promptSchema = z.object({
  name: z.string().min(1).max(255),
  prompt: z.string(),
  selections: z.record(z.string(), z.array(z.string())),
  customValues: z.record(z.string(), z.array(z.string())),
  image: z.string().nullable().optional(),
  imageFull: z.string().nullable().optional(),
  selectedLensId: z.string().nullable().optional(),
  selectedLensStyle: z.string().nullable().optional(),
  selectedCameraId: z.string().nullable().optional(),
  selectedCameraType: z.string().nullable().optional(),
});

// Get all prompts for the current user
promptsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const prompts = await prisma.savedPrompt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Transform to match frontend format
  const transformed = prompts.map((p) => ({
    id: p.id,
    name: p.name,
    prompt: p.prompt,
    selections: JSON.parse(p.selections),
    customValues: JSON.parse(p.customValues),
    image: p.image,
    imageFull: p.imageFull,
    selectedLensId: p.selectedLensId,
    selectedLensStyle: p.selectedLensStyle,
    selectedCameraId: p.selectedCameraId,
    selectedCameraType: p.selectedCameraType,
    createdAt: p.createdAt.getTime(),
  }));

  return c.json({ data: transformed });
});

// Create a new prompt
promptsRouter.post("/", zValidator("json", promptSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const body = c.req.valid("json");

  const prompt = await prisma.savedPrompt.create({
    data: {
      userId: user.id,
      name: body.name,
      prompt: body.prompt,
      selections: JSON.stringify(body.selections),
      customValues: JSON.stringify(body.customValues),
      image: body.image ?? null,
      imageFull: body.imageFull ?? null,
      selectedLensId: body.selectedLensId ?? null,
      selectedLensStyle: body.selectedLensStyle ?? null,
      selectedCameraId: body.selectedCameraId ?? null,
      selectedCameraType: body.selectedCameraType ?? null,
    },
  });

  return c.json({
    data: {
      id: prompt.id,
      name: prompt.name,
      prompt: prompt.prompt,
      selections: JSON.parse(prompt.selections),
      customValues: JSON.parse(prompt.customValues),
      image: prompt.image,
      imageFull: prompt.imageFull,
      selectedLensId: prompt.selectedLensId,
      selectedLensStyle: prompt.selectedLensStyle,
      selectedCameraId: prompt.selectedCameraId,
      selectedCameraType: prompt.selectedCameraType,
      createdAt: prompt.createdAt.getTime(),
    },
  });
});

// Update a prompt
promptsRouter.put("/:id", zValidator("json", promptSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const body = c.req.valid("json");

  // Check ownership
  const existing = await prisma.savedPrompt.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
  }

  const prompt = await prisma.savedPrompt.update({
    where: { id },
    data: {
      name: body.name,
      prompt: body.prompt,
      selections: JSON.stringify(body.selections),
      customValues: JSON.stringify(body.customValues),
      image: body.image ?? null,
      imageFull: body.imageFull ?? null,
      selectedLensId: body.selectedLensId ?? null,
      selectedLensStyle: body.selectedLensStyle ?? null,
      selectedCameraId: body.selectedCameraId ?? null,
      selectedCameraType: body.selectedCameraType ?? null,
    },
  });

  return c.json({
    data: {
      id: prompt.id,
      name: prompt.name,
      prompt: prompt.prompt,
      selections: JSON.parse(prompt.selections),
      customValues: JSON.parse(prompt.customValues),
      image: prompt.image,
      imageFull: prompt.imageFull,
      selectedLensId: prompt.selectedLensId,
      selectedLensStyle: prompt.selectedLensStyle,
      selectedCameraId: prompt.selectedCameraId,
      selectedCameraType: prompt.selectedCameraType,
      createdAt: prompt.createdAt.getTime(),
    },
  });
});

// Delete a prompt
promptsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");

  // Check ownership
  const existing = await prisma.savedPrompt.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
  }

  await prisma.savedPrompt.delete({ where: { id } });

  return c.body(null, 204);
});

// Update just the image for a prompt
promptsRouter.patch("/:id/image", zValidator("json", z.object({
  image: z.string().nullable(),
  imageFull: z.string().nullable(),
})), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const body = c.req.valid("json");

  // Check ownership
  const existing = await prisma.savedPrompt.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
  }

  const prompt = await prisma.savedPrompt.update({
    where: { id },
    data: {
      image: body.image,
      imageFull: body.imageFull,
    },
  });

  return c.json({ data: { id: prompt.id, image: prompt.image, imageFull: prompt.imageFull } });
});
