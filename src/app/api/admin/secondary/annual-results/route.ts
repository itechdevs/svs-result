import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/annual-results
export const GET = withHandler(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const academicYearId = url.searchParams.get("academicYearId");
    const gradeLevel = url.searchParams.get("gradeLevel");

    if (!academicYearId) {
      return badRequest("academicYearId is required");
    }
    if (!gradeLevel) {
      return badRequest("gradeLevel is required");
    }

    const results = await prisma.secondaryAnnualResult.findMany({
      where: {
        academicYearId,
        syncedStudent: {
          class: gradeLevel
        }
      },
      include: {
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            class: true,
            section: true,
          }
        },
        subjectResults: {
          include: {
            subjectConfig: {
              include: {
                syncedSubject: true,
                components: true // Need this to compute the dynamic breakdown
              }
            }
          }
        },
        marksheet: {
          select: {
            id: true,
            generatedAt: true
          }
        }
      },
      orderBy: [
        { syncedStudent: { section: "asc" } },
        { syncedStudent: { rollNumber: "asc" } }
      ]
    });

    const termWeights = await prisma.secondaryTermWeight.findMany({
      where: { academicYearId, gradeLevel },
      include: { exam: true },
      orderBy: { displayOrder: 'asc' }
    });

    const studentIds = results.map(r => r.syncedStudentId);

    const termResults = await prisma.secondarySubjectResult.findMany({
      where: {
        syncedStudentId: { in: studentIds },
        examId: { in: termWeights.map(w => w.examId) }
      }
    });

    // Helper to get grade from percentage
    const SECONDARY_GRADE_SCALE = [
      { min: 90, max: 100, grade: "A+", gradePoint: 4.0, isNG: false },
      { min: 80, max: 89.99, grade: "A", gradePoint: 3.6, isNG: false },
      { min: 70, max: 79.99, grade: "B+", gradePoint: 3.2, isNG: false },
      { min: 60, max: 69.99, grade: "B", gradePoint: 2.8, isNG: false },
      { min: 50, max: 59.99, grade: "C+", gradePoint: 2.4, isNG: false },
      { min: 40, max: 49.99, grade: "C", gradePoint: 2.0, isNG: false },
      { min: 35, max: 39.99, grade: "D", gradePoint: 1.6, isNG: false },
      { min: 0, max: 34.99, grade: "NG", gradePoint: 0.0, isNG: true },
    ] as const;

    const getGrade = (pct: number) => {
      for (const scale of SECONDARY_GRADE_SCALE) {
        if (pct >= scale.min && (pct <= scale.max || (scale.max === 100 && pct >= 100))) return scale;
      }
      if (pct < 0) return SECONDARY_GRADE_SCALE[SECONDARY_GRADE_SCALE.length - 1];
      if (pct > 100) return SECONDARY_GRADE_SCALE[0];
      return SECONDARY_GRADE_SCALE[SECONDARY_GRADE_SCALE.length - 1];
    };

    // Attach component breakdown dynamically
    const enrichedResults = results.map(result => {
      const studentTerms = termResults.filter(tr => tr.syncedStudentId === result.syncedStudentId);
      
      const enrichedSubjectResults = result.subjectResults.map(subResult => {
        const config = subResult.subjectConfig;
        const subTerms = studentTerms.filter(t => t.subjectConfigId === config.id);
        const components: any[] = [];
        
        for (const comp of config.components) {
          const compFull = Number(comp.fullMarks);
          const compPass = Number(comp.passMarks ?? 0);
          const compCH = Number(comp.creditHour ?? 1);
          
          let compWeightedObt = 0;
          let compWeightedFull = 0;
          
          const termBreakdown: any[] = [];

          for (const tw of termWeights) {
            const weightFrac = Number(tw.weightPercent) / 100;
            const termRes = subTerms.find(t => t.examId === tw.examId);
            
            let termMark = 0;
            if (termRes) {
              if (comp.type === 'THEORY') termMark = Number(termRes.theoryMarks ?? 0);
              else if (comp.type === 'PRACTICAL') termMark = Number(termRes.practicalMarks ?? 0);
              else if (comp.type === 'INTERNAL') termMark = Number(termRes.internalMarks ?? 0);
            }
            
            const contributionObt = termMark * weightFrac;
            const contributionFull = compFull * weightFrac; 
            
            compWeightedObt += contributionObt;
            compWeightedFull += contributionFull;
            
            termBreakdown.push({
              examId: tw.examId,
              termName: tw.termName,
              weightPercent: Number(tw.weightPercent),
              obtained: termMark,
              fullMarks: compFull,
              contributionObt,
              contributionFull
            });
          }
          
          const compPercentage = compWeightedFull > 0 ? (compWeightedObt / compWeightedFull) * 100 : 0;
          const compGradeInfo = getGrade(compPercentage);
          
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
            termBreakdown
          });
        }

        // Overall subject is NG if any component is NG (uses stored subResult.isNG from compile)
        return {
          ...subResult,
          componentDetails: components
        };
      });

      return {
        ...result,
        subjectResults: enrichedSubjectResults
      };
    });

    return ok(enrichedResults);
  },
  ["ADMIN"]
);
