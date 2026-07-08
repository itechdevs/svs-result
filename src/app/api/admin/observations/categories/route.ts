import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import {
  createObservationCategorySchema,
  listObservationCategoriesSchema,
} from "@/lib/schemas";

export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = listObservationCategoriesSchema.parse(
    Object.fromEntries(searchParams)
  );

  const categories = await prisma.observationCategory.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    ...(query.includeItems && {
      include: {
        items: {
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
  });

  return ok(categories);
}, ["ADMIN"]);

export const POST = withHandler(async (req: NextRequest) => {
  const body = createObservationCategorySchema.parse(await req.json());

  // Auto-assign displayOrder to end if not provided
  if (!body.displayOrder) {
    const last = await prisma.observationCategory.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    body.displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  const category = await prisma.observationCategory.create({
    data: body,
    include: {
      items: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return created(category, "Observation category created");
}, ["ADMIN"]);
