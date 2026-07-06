import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/marks
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const status = searchParams.get("status");
    const subjectConfigId = searchParams.get("subjectConfigId");
    const syncedStudentId = searchParams.get("syncedStudentId");

    const where: any = {};

    if (examId) {
      where.examId = examId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (subjectConfigId) {
      where.component = {
        subjectConfigId: subjectConfigId
      };
    }

    if (syncedStudentId) {
      where.syncedStudentId = syncedStudentId;
    }

    const marks = await prisma.secondaryComponentMark.findMany({
      where,
      include: {
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            section: true,
          }
        },
        component: {
          select: {
            id: true,
            type: true,
            fullMarks: true,
            passMarks: true,
            subjectConfig: {
              select: {
                syncedSubject: {
                  select: {
                    name: true,
                    code: true,
                  }
                }
              }
            }
          }
        },
        exam: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          }
        },
        enteredBy: {
          select: {
            name: true,
            email: true,
          }
        },
        verifiedBy: {
          select: {
            name: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // DRAFT, SUBMITTED, VERIFIED
        { syncedStudent: { rollNumber: 'asc' } },
        { component: { type: 'asc' } }
      ]
    });

    return ok(marks);
  },
  ["ADMIN"]
);
