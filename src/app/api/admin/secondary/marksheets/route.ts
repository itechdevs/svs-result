import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { secondaryMarksheetSchema } from "@/lib/schemas";

// POST /api/admin/secondary/marksheets
export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const body = secondaryMarksheetSchema.parse(await req.json());
    
    if (body.termResultId) {
      const termResult = await prisma.secondaryTermResult.findUnique({
        where: { id: body.termResultId },
        include: {
          syncedStudent: true,
          exam: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
            }
          },
          academicYear: {
            select: {
              id: true,
              name: true,
            }
          },
          subjectResults: {
            include: {
              subjectConfig: {
                include: {
                  syncedSubject: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    }
                  }
                }
              }
            }
          }
        }
      });
      if (!termResult) return notFound("Term result not found");
      if (!termResult.isPublished) return badRequest("Cannot generate marksheet for unpublished result");
      
      const marksheet = await prisma.secondaryMarksheet.upsert({
        where: { termResultId: body.termResultId },
        update: {
          metadata: JSON.parse(JSON.stringify(termResult)),
          generatedById: user.id,
          generatedAt: new Date()
        },
        create: {
          syncedStudentId: termResult.syncedStudentId,
          termResultId: termResult.id,
          academicYearId: termResult.academicYearId,
          examId: termResult.examId,
          generatedById: user.id,
          metadata: JSON.parse(JSON.stringify(termResult))
        }
      });
      return ok(marksheet, "Term Marksheet generated successfully");
    }

    if (body.annualResultId) {
      const annualResult = await prisma.secondaryAnnualResult.findUnique({
        where: { id: body.annualResultId },
        include: {
          syncedStudent: true,
          academicYear: {
            select: {
              id: true,
              name: true,
            }
          },
          subjectResults: {
            include: {
              subjectConfig: {
                include: {
                  syncedSubject: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    }
                  }
                }
              }
            }
          }
        }
      });
      if (!annualResult) return notFound("Annual result not found");
      if (!annualResult.isPublished) return badRequest("Cannot generate marksheet for unpublished result");
      
      const marksheet = await prisma.secondaryMarksheet.upsert({
        where: { annualResultId: body.annualResultId },
        update: {
          metadata: JSON.parse(JSON.stringify(annualResult)),
          generatedById: user.id,
          generatedAt: new Date()
        },
        create: {
          syncedStudentId: annualResult.syncedStudentId,
          annualResultId: annualResult.id,
          academicYearId: annualResult.academicYearId,
          generatedById: user.id,
          metadata: JSON.parse(JSON.stringify(annualResult))
        }
      });
      return ok(marksheet, "Annual Marksheet generated successfully");
    }

    return badRequest("Invalid request");
  },
  ["ADMIN"]
);
