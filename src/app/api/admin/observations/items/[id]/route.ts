import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateObservationItemSchema } from "@/lib/schemas";

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const existing = await prisma.observationItem.findUnique({
    where: { id: params.id },
  });
  if (!existing) return notFound("Observation item not found");

  const body = updateObservationItemSchema.parse(await req.json());

  const item = await prisma.observationItem.update({
    where: { id: params.id },
    data: body,
  });

  return ok(item, "Observation item updated");
}, ["ADMIN"]);

export const DELETE = withHandler(async (_req, { params }) => {
  const existing = await prisma.observationItem.findUnique({
    where: { id: params.id },
  });
  if (!existing) return notFound("Observation item not found");

  await prisma.observationItem.delete({ where: { id: params.id } });

  return ok(null, "Observation item deleted");
}, ["ADMIN"]);
