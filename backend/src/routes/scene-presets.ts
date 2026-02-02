import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

const scenePresetsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Get all scene presets for the current user, optionally filtered by category
scenePresetsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const category = c.req.query("category");

  const presets = await prisma.scenePreset.findMany({
    where: {
      userId: user.id,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: presets });
});

// Create a new scene preset
scenePresetsRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { name, category, value } = await c.req.json();

  if (!name || !category || !value) {
    return c.json({ error: { message: "Name, category, and value are required" } }, 400);
  }

  const validCategories = ["action", "wardrobe", "environment", "subjects"];
  if (!validCategories.includes(category)) {
    return c.json({ error: { message: "Invalid category" } }, 400);
  }

  const preset = await prisma.scenePreset.create({
    data: {
      userId: user.id,
      name,
      category,
      value,
    },
  });

  return c.json({ data: preset });
});

// Delete a scene preset
scenePresetsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const id = c.req.param("id");

  // Verify ownership
  const preset = await prisma.scenePreset.findFirst({
    where: { id, userId: user.id },
  });

  if (!preset) {
    return c.json({ error: { message: "Preset not found" } }, 404);
  }

  await prisma.scenePreset.delete({ where: { id } });

  return c.json({ data: { success: true } });
});

// Update a scene preset (PATCH)
scenePresetsRouter.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const id = c.req.param("id");
  const { value, name } = await c.req.json();

  // Verify ownership
  const preset = await prisma.scenePreset.findFirst({
    where: { id, userId: user.id },
  });

  if (!preset) {
    return c.json({ error: { message: "Preset not found" } }, 404);
  }

  const updated = await prisma.scenePreset.update({
    where: { id },
    data: {
      ...(value !== undefined ? { value } : {}),
      ...(name !== undefined ? { name } : {}),
    },
  });

  return c.json({ data: updated });
});

export { scenePresetsRouter };
