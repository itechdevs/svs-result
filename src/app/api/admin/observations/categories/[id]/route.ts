import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateObservationCategorySchema } from "@/lib/schemas";

export const GET = withHandler(async (_req, { params }) => {
  const category = await prisma.observationCategory.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!category) return notFound("Observation category not found");
  return ok(category);
}, ["ADMIN"]);

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const existing = await prisma.observationCategory.findUnique({
    where: { id: params.id },
  });
  if (!existing) return notFound("Observation category not found");

  const body = updateObservationCategorySchema.parse(await req.json());

  const category = await prisma.observationCategory.update({
    where: { id: params.id },
    data: body,
    include: {
      items: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return ok(category, "Observation category updated");
}, ["ADMIN"]);

export const DELETE = withHandler(async (_req, { params }) => {
  const existing = await prisma.observationCategory.findUnique({
    where: { id: params.id },
  });
  if (!existing) return notFound("Observation category not found");

  // Cascade delete handled by Prisma / DB (onDelete: Cascade on items)
  await prisma.observationCategory.delete({ where: { id: params.id } });

  return ok(null, "Observation category deleted");
}, ["ADMIN"]);
