import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { createUserSchema, listUsersSchema } from "@/lib/schemas";

// GET /api/admin/users
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = listUsersSchema.parse(Object.fromEntries(searchParams));

    const where = {
      ...(query.role && { role: query.role }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as const } },
          { email: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          syncedTeacher: { select: { id: true, name: true } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return ok({ users, total, page: query.page, limit: query.limit });
  },
  ["ADMIN"],
);

// POST /api/admin/users
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createUserSchema.parse(await req.json());

    if (body.role === "TEACHER" && !body.syncedTeacherId) {
      return badRequest("syncedTeacherId is required for TEACHER role");
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) return conflict("Email already registered");

    if (body.syncedTeacherId) {
      const teacher = await prisma.syncedTeacher.findUnique({
        where: { id: body.syncedTeacherId },
        include: { user: true },
      });
      if (!teacher) return badRequest("SyncedTeacher not found");
      if (teacher.user)
        return conflict("This teacher already has a user account");
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role,
        syncedTeacherId: body.syncedTeacherId ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return created(user, "User created");
  },
  ["ADMIN"],
);
