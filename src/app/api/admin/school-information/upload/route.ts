import { NextRequest } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

const SCHOOL_INFO_ID = "school-config";
const UPLOAD_DIR = path.join(process.cwd(), "public", "school");
const PUBLIC_URL_PREFIX = "/school";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const IMAGE_TYPES = ["logo", "signature", "stamp", "favicon"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const DB_FIELD_BY_TYPE: Record<ImageType, "logoUrl" | "faviconUrl" | "principalSignatureUrl" | "schoolStampUrl"> = {
  logo: "logoUrl",
  favicon: "faviconUrl",
  signature: "principalSignatureUrl",
  stamp: "schoolStampUrl",
};

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

function isImageType(value: string): value is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(value);
}

async function removeLocalFile(url: string | null | undefined) {
  if (!url || !url.startsWith(PUBLIC_URL_PREFIX)) return;
  try {
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    // Old file already gone — ignore
  }
}

// POST /api/admin/school-information/upload (ADMIN only)
// multipart/form-data: file=<File>, type=logo|signature|stamp|favicon
export const POST = withHandler(
  async (req: NextRequest) => {
    const formData = await req.formData();
    const typeRaw = formData.get("type");
    const file = formData.get("file");

    if (typeof typeRaw !== "string" || !isImageType(typeRaw)) {
      return badRequest("Invalid image type. Must be one of: logo, signature, stamp, favicon");
    }
    if (!(file instanceof File)) {
      return badRequest("No file provided");
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return badRequest("Only PNG, JPG, WebP or SVG images are allowed");
    }
    if (file.size > MAX_FILE_SIZE) {
      return badRequest("File size must be 5MB or less");
    }

    const fileName = `${typeRaw}-${createId()}${EXT_BY_MIME[file.type] ?? ""}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(
      path.join(UPLOAD_DIR, fileName),
      Buffer.from(await file.arrayBuffer()),
    );

    const dbField = DB_FIELD_BY_TYPE[typeRaw];
    const existing = await prisma.schoolInformation.findUnique({
      where: { id: SCHOOL_INFO_ID },
    });

    const url = `${PUBLIC_URL_PREFIX}/${fileName}`;
    const school = await prisma.schoolInformation.upsert({
      where: { id: SCHOOL_INFO_ID },
      update: { [dbField]: url },
      create: {
        id: SCHOOL_INFO_ID,
        schoolName: "My School",
        country: "Nepal",
        [dbField]: url,
      },
    });

    await removeLocalFile(existing?.[dbField]);

    return ok(school, "Image uploaded");
  },
  ["ADMIN"],
);

// DELETE /api/admin/school-information/upload?type=logo (ADMIN only)
export const DELETE = withHandler(
  async (req: NextRequest) => {
    const typeRaw = new URL(req.url).searchParams.get("type") ?? "";
    if (!isImageType(typeRaw)) {
      return badRequest("Invalid image type. Must be one of: logo, signature, stamp, favicon");
    }

    const dbField = DB_FIELD_BY_TYPE[typeRaw];
    const existing = await prisma.schoolInformation.findUnique({
      where: { id: SCHOOL_INFO_ID },
    });

    if (!existing || !existing[dbField]) {
      return notFound("No image set for this type");
    }

    await removeLocalFile(existing[dbField]);

    const school = await prisma.schoolInformation.update({
      where: { id: SCHOOL_INFO_ID },
      data: { [dbField]: null },
    });

    return ok(school, "Image removed");
  },
  ["ADMIN"],
);
