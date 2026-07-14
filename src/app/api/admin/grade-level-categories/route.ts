import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { batchUpsertGradeLevelCategoriesSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/grade-level-categories
export const GET = withHandler(
  async () => {
    const categories = await prisma.gradeLevelCategory.findMany({
      orderBy: { gradeLevel: "asc" },
    });
    return ok(categories);
  },
  ["ADMIN"],
);

// PATCH /api/admin/grade-level-categories
export const PATCH = withHandler(
  async (req: NextRequest) => {
    const { mappings } = batchUpsertGradeLevelCategoriesSchema.parse(
      await req.json(),
    );

    await prisma.$transaction(
      mappings.map((m) =>
        prisma.gradeLevelCategory.upsert({
          where: { gradeLevel: m.gradeLevel },
          create: {
            gradeLevel: m.gradeLevel,
            schoolLevel: m.schoolLevel,
          },
          update: {
            schoolLevel: m.schoolLevel,
          },
        }),
      ),
    );

    const categories = await prisma.gradeLevelCategory.findMany({
      orderBy: { gradeLevel: "asc" },
    });
    return ok(categories, "Grade level categories updated");
  },
  ["ADMIN"],
);
