import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { listSyncLogsSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/sync/logs
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = listSyncLogsSchema.parse(Object.fromEntries(searchParams));

    const [total, logs] = await prisma.$transaction([
      prisma.syncLog.count({
        where: {
          ...(query.entity && { entity: query.entity }),
          ...(query.status && { status: query.status }),
          ...(query.sourceId && { sourceId: query.sourceId }),
        },
      }),
      prisma.syncLog.findMany({
        where: {
          ...(query.entity && { entity: query.entity }),
          ...(query.status && { status: query.status }),
          ...(query.sourceId && { sourceId: query.sourceId }),
        },
        orderBy: { syncedAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return ok({ logs, total, page: query.page, limit: query.limit });
  },
  ["ADMIN"],
);
