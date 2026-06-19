import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { createAcademicYearSchema } from "@/lib/schemas";

// GET /api/admin/academic-years
export const GET = withHandler(async () => {
  const years = await prisma.academicYear.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: {
          gradeConfigs: true,
          finalResults: true,
        },
      },
    },
  });
  return ok(years);
}, ["ADMIN", "TEACHER"]);

// POST /api/admin/academic-years
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createAcademicYearSchema.parse(await req.json());

    const existing = await prisma.academicYear.findUnique({
      where: { name: body.name },
    });
    if (existing)
      return conflict("Academic year with this name already exists");

    // If setting as current, unset others
    if (body.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const year = await prisma.academicYear.create({ data: body });
    return created(year, "Academic year created");
  },
  ["ADMIN"],
);
