import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { updateSecondarySubjectConfigSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// PUT /api/admin/secondary/subject-configs/[id]
export const PUT = withHandler(
  async (req: NextRequest, { params }) => {
    const { id } = await params;
    const body = updateSecondarySubjectConfigSchema.parse(await req.json());

    const existing = await prisma.secondarySubjectConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFound("Configuration not found");
    }

    const config = await prisma.secondarySubjectConfig.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.creditHours !== undefined && { creditHours: body.creditHours }),
      },
    });

    return ok(config, "Configuration updated successfully");
  },
  ["ADMIN"],
);

// DELETE /api/admin/secondary/subject-configs/[id]
export const DELETE = withHandler(
  async (req: NextRequest, { params }) => {
    const { id } = await params;

    const existing = await prisma.secondarySubjectConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFound("Configuration not found");
    }

    // Soft delete by deactivating
    await prisma.secondarySubjectConfig.update({
      where: { id },
      data: { isActive: false },
    });

    return ok(null, "Configuration deactivated successfully");
  },
  ["ADMIN"],
);
