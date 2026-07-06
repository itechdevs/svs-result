import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyAllMarks() {
  try {
    console.log("🔍 Finding all unverified marks...\n");

    // Find all marks that are SUBMITTED but not VERIFIED
    const unverifiedMarks = await prisma.secondaryComponentMark.findMany({
      where: {
        status: {
          in: ["SUBMITTED", "DRAFT"]
        }
      },
      include: {
        syncedStudent: {
          select: {
            name: true,
            rollNumber: true
          }
        },
        component: {
          select: {
            type: true,
            subjectConfig: {
              select: {
                syncedSubject: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        exam: {
          select: {
            name: true,
            gradeLevel: true
          }
        },
        enteredBy: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${unverifiedMarks.length} unverified marks:\n`);

    if (unverifiedMarks.length === 0) {
      console.log("✅ All marks are already verified!");
      return;
    }

    // Display details of unverified marks
    unverifiedMarks.forEach((mark, index) => {
      console.log(`${index + 1}. Student: ${mark.syncedStudent.name} (Roll: ${mark.syncedStudent.rollNumber})`);
      console.log(`   Subject: ${mark.component.subjectConfig.syncedSubject.name}`);
      console.log(`   Component: ${mark.component.type}`);
      console.log(`   Exam: ${mark.exam.name} (${mark.exam.gradeLevel})`);
      console.log(`   Status: ${mark.status}`);
      console.log(`   Marks: ${mark.isAbsent ? 'ABSENT' : mark.marksObtained}`);
      console.log(`   Entered by: ${mark.enteredBy.name}`);
      console.log(`   ID: ${mark.id}\n`);
    });

    // Get an admin user to set as verifier
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN"
      }
    });

    if (!adminUser) {
      console.error("❌ No admin user found in the database!");
      return;
    }

    console.log(`✅ Using admin user: ${adminUser.name} (${adminUser.email})\n`);

    // Confirm before proceeding
    console.log("🚀 Starting bulk verification...\n");

    // Update all unverified marks to VERIFIED status
    const result = await prisma.secondaryComponentMark.updateMany({
      where: {
        status: {
          in: ["SUBMITTED", "DRAFT"]
        }
      },
      data: {
        status: "VERIFIED",
        verifiedById: adminUser.id,
        verifiedAt: new Date(),
        remarks: "Bulk verified via script"
      }
    });

    console.log(`✅ Successfully verified ${result.count} marks!\n`);

    // Verify the results
    const stillUnverified = await prisma.secondaryComponentMark.count({
      where: {
        status: {
          not: "VERIFIED"
        }
      }
    });

    if (stillUnverified === 0) {
      console.log("🎉 All marks are now verified and ready for compilation!");
    } else {
      console.log(`⚠️  Warning: ${stillUnverified} marks are still not verified.`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllMarks();
