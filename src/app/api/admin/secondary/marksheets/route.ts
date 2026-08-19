import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { secondaryMarksheetSchema } from "@/lib/schemas";
import { getSecondaryGrade } from "@/lib/secondary-grades";

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
                  components: true,
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
                  components: true,
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

      // We need to fetch term weights and term results to compute component-level marks for the marksheet
      const termWeights = await prisma.secondaryTermWeight.findMany({
        where: {
          academicYearId: annualResult.academicYearId,
          gradeLevel: annualResult.syncedStudent.class,
        }
      });

      const termExamIds = termWeights.map(tw => tw.examId);

      const termResults = await prisma.secondarySubjectResult.findMany({
        where: {
          syncedStudentId: annualResult.syncedStudentId,
          examId: { in: termExamIds },
        }
      });

      const enrichedSubjectResults = annualResult.subjectResults.map(subResult => {
        const config = subResult.subjectConfig;
        const subTerms = termResults.filter(t => t.subjectConfigId === config.id);
        const components: any[] = [];

        // Ensure components exist as part of the config
        const configComponents = config?.components || (config as any)?.components || [];

        for (const comp of configComponents) {
          const compFull = Number(comp.fullMarks);
          const compPass = Number(comp.passMarks ?? 0);
          const compCH = Number(comp.creditHour ?? 1);

          let compWeightedObt = 0;
          let compWeightedFull = 0;

          for (const tw of termWeights) {
            const weightFrac = Number(tw.weightPercent) / 100;
            const termRes = subTerms.find(t => t.examId === tw.examId);

            let termMark = 0;
            if (termRes) {
              if (comp.type === 'THEORY') termMark = Number(termRes.theoryMarks ?? 0);
              else if (comp.type === 'PRACTICAL') termMark = Number(termRes.practicalMarks ?? 0);
              else if (comp.type === 'INTERNAL') termMark = Number(termRes.internalMarks ?? 0);
            }

            compWeightedObt += termMark * weightFrac;
            compWeightedFull += compFull * weightFrac;
          }

          const compPercentage = compWeightedFull > 0 ? (compWeightedObt / compWeightedFull) * 100 : 0;
          const compGradeInfo = getSecondaryGrade(compPercentage);

          components.push({
            id: comp.id,
            type: comp.type,
            creditHour: compCH,
            fullMarks: compWeightedFull,
            passMarks: compPass,
            obtainedMarks: compWeightedObt,
            percentage: compPercentage,
            grade: compGradeInfo.isNG ? 'NG' : compGradeInfo.grade,
            gradePoint: compGradeInfo.isNG ? 0 : compGradeInfo.gradePoint,
            isNG: compGradeInfo.isNG,
          });
        }

        return {
          ...subResult,
          componentDetails: components
        };
      });

      const enrichedAnnualResult = {
        ...annualResult,
        subjectResults: enrichedSubjectResults
      };

      const marksheet = await prisma.secondaryMarksheet.upsert({
        where: { annualResultId: body.annualResultId },
        update: {
          metadata: JSON.parse(JSON.stringify(enrichedAnnualResult)),
          generatedById: user.id,
          generatedAt: new Date()
        },
        create: {
          syncedStudentId: enrichedAnnualResult.syncedStudentId,
          annualResultId: enrichedAnnualResult.id,
          academicYearId: enrichedAnnualResult.academicYearId,
          generatedById: user.id,
          metadata: JSON.parse(JSON.stringify(enrichedAnnualResult))
        }
      });
      return ok(marksheet, "Annual Marksheet generated successfully");
    }

    return badRequest("Invalid request");
  },
  ["ADMIN"]
);
