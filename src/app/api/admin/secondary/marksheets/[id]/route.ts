import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/marksheets/[id]
export const GET = withHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    
    const marksheet = await prisma.secondaryMarksheet.findUnique({
      where: { id },
      include: {
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            section: true,
            class: true,
          }
        },
        termResult: {
          include: {
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
                  select: {
                    id: true,
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
        },
        annualResult: {
          include: {
            academicYear: {
              select: {
                id: true,
                name: true,
              }
            },
            subjectResults: {
              include: {
                subjectConfig: {
                  select: {
                    id: true,
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
        },
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!marksheet) return notFound("Marksheet not found");
    
    return ok(marksheet);
  },
  ["ADMIN", "TEACHER"]
);
