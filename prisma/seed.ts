import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.$transaction([
    prisma.teacherAssignment.deleteMany(),
    prisma.syncedStudent.deleteMany(),
    prisma.user.deleteMany(),
    prisma.syncedTeacher.deleteMany(),
    prisma.syncedSubject.deleteMany(),
    prisma.academicYear.deleteMany(),
  ])

  const passwordHash = await hash('password123', 10)

  // Academic Year
  const academicYear = await prisma.academicYear.create({
    data: { name: '2024/25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isCurrent: true },
  })

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      passwordHash,
      role: UserRole.ADMIN,
      name: 'Admin User',
      isActive: true,
      emailVerified: new Date(),
    },
  })

  // Teachers (5)
  const teacherNames = ['Sarah Johnson', 'David Chen', 'Emily Rodriguez', 'James Wilson', 'Priya Sharma']
  const syncedTeachers = await Promise.all(
    teacherNames.map((name, i) =>
      prisma.syncedTeacher.create({ data: { sourceId: `T${i + 1}`, name, isActive: true } })
    )
  )

  const teachers = await Promise.all(
    syncedTeachers.map((st, i) =>
      prisma.user.create({
        data: {
          email: `teacher${i + 1}@school.com`,
          passwordHash,
          role: UserRole.TEACHER,
          name: st.name,
          isActive: true,
          emailVerified: new Date(),
          syncedTeacherId: st.id,
        },
      })
    )
  )

  // Subjects & Grades
  const gradesSubjects = [
    { grade: 'Grade 1', subjects: ['English', 'Math', 'Science'] },
    { grade: 'Grade 2', subjects: ['English', 'Math', 'Science'] },
    { grade: 'Grade 3', subjects: ['English', 'Math', 'Science'] },
  ]

  const allSubjects = []
  for (const gs of gradesSubjects) {
    for (const subj of gs.subjects) {
      const subject = await prisma.syncedSubject.create({
        data: {
          sourceId: `${gs.grade}-${subj}`,
          name: subj,
          code: `${subj.substring(0, 3).toUpperCase()}-${gs.grade.replace(' ', '')}`,
          gradeLevel: gs.grade,
          isActive: true,
        },
      })
      allSubjects.push({ ...subject, grade: gs.grade })
    }
  }

  // Assign teachers to subjects/grades
  const assignments = [
    { teacherId: teachers[0].id, grade: 'Grade 1', subjectId: allSubjects.find((s) => s.grade === 'Grade 1' && s.name === 'English')!.id },
    { teacherId: teachers[1].id, grade: 'Grade 1', subjectId: allSubjects.find((s) => s.grade === 'Grade 1' && s.name === 'Math')!.id },
    { teacherId: teachers[2].id, grade: 'Grade 2', subjectId: allSubjects.find((s) => s.grade === 'Grade 2' && s.name === 'English')!.id },
    { teacherId: teachers[3].id, grade: 'Grade 2', subjectId: allSubjects.find((s) => s.grade === 'Grade 2' && s.name === 'Math')!.id },
    { teacherId: teachers[4].id, grade: 'Grade 3', subjectId: allSubjects.find((s) => s.grade === 'Grade 3' && s.name === 'Science')!.id },
  ]

  await prisma.teacherAssignment.createMany({
    data: assignments.map((a) => ({
      userId: a.teacherId,
      gradeLevel: a.grade,
      syncedSubjectId: a.subjectId,
      academicYearId: academicYear.id,
      assignedBy: admin.id,
    })),
  })

  // Students (10 per grade)
  const studentNames = [
    'Emma Wilson', 'Liam Brown', 'Olivia Davis', 'Noah Garcia', 'Sophia Martinez',
    'Mason Anderson', 'Ava Taylor', 'Ethan Thomas', 'Isabella Moore', 'Lucas White',
  ]

  for (const gs of gradesSubjects) {
    await Promise.all(
      studentNames.map((name, i) =>
        prisma.syncedStudent.create({
          data: {
            sourceId: `${gs.grade}-S${i + 1}`,
            name,
            rollNumber: `${gs.grade.replace(' ', '')}${String(i + 1).padStart(3, '0')}`,
            grade: gs.grade,
            section: 'A',
            isActive: true,
          },
        })
      )
    )
  }

  console.log('✅ Seed complete!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@school.com / password123')
  console.log('Teachers: teacher1@school.com to teacher5@school.com / password123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
