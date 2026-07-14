import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { createSecondaryPracticalHeadingSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/components/[id]/headings
export const GET = withHandler(
  async (req: NextRequest, { params }) => {
    const { id: componentId } = await params;

    const component = await prisma.secondarySubjectComponent.findUnique({
      where: { id: componentId },
      include: {
        practicalHeadings: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!component) {
      return notFound("Component not found");
    }

    return ok(component.practicalHeadings);
  },
  ["ADMIN"],
);

// POST /api/admin/secondary/components/[id]/headings
export const POST = withHandler(
  async (req: NextRequest, { params }) => {
    const { id: componentId } = await params;
    const body = createSecondaryPracticalHeadingSchema.parse(await req.json());

    const component = await prisma.secondarySubjectComponent.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return notFound("Component not found");
    }

    if (component.type !== "PRACTICAL") {
      return badRequest("Headings can only be added to PRACTICAL components");
    }

    // Validate that headings sum to the component fullMarks
    const totalMarks = body.headings.reduce((sum, h) => sum + h.fullMarks, 0);
    if (totalMarks !== Number(component.fullMarks)) {
      return badRequest(`Headings must sum exactly to component full marks (${component.fullMarks}). Current sum: ${totalMarks}`);
    }

    // Replace all headings for this component
    await prisma.secondaryPracticalHeading.deleteMany({
      where: { componentId },
    });

    const headings = await prisma.$transaction(
      body.headings.map(h => 
        prisma.secondaryPracticalHeading.create({
          data: {
            componentId,
            name: h.name,
            fullMarks: h.fullMarks,
            displayOrder: h.displayOrder,
          }
        })
      )
    );

    return ok(headings, "Practical headings saved successfully");
  },
  ["ADMIN"],
);
