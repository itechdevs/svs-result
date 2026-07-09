import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { created, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { createObservationItemSchema } from "@/lib/schemas";

export const GET = withHandler(async (_req, { params }) => {
  const category = await prisma.observationCategory.findUnique({
    where: { id: params.id },
  });
  if (!category) return notFound("Observation category not found");

  const items = await prisma.observationItem.findMany({
    where: { observationCategoryId: params.id },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return ok(items);
}, ["ADMIN"]);

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const category = await prisma.observationCategory.findUnique({
    where: { id: params.id },
  });
  if (!category) return notFound("Observation category not found");

  const body = createObservationItemSchema.parse(await req.json());

  // Auto-assign displayOrder to end of this category if not explicitly provided
  if (!body.displayOrder) {
    const last = await prisma.observationItem.findFirst({
      where: { observationCategoryId: params.id },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    body.displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  const item = await prisma.observationItem.create({
    data: {
      ...body,
      observationCategoryId: params.id,
    },
  });

  return created(item, "Observation item created");
}, ["ADMIN"]);
