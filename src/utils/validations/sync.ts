import { z } from "zod";

export const teacherSyncSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string(),
  subject: z.string().nullable(),
  designation: z.string(),
  designationId: z.string(),
  imageUrl: z.string().optional(),
  assignedClasses: z.array(z.string()).default([]),
  classTeacher: z.string().nullable(),
  subjects: z.array(z.string()).default([]),
  user: z.object({
    email: z.string().email(),
    name: z.string(),
    role: z.enum(["TEACHER", "ADMIN", "SUPER_ADMIN"]),
  }),
});

export const teacherBatchSyncSchema = z.array(teacherSyncSchema);
