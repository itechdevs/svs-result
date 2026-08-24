import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateSchoolInformationSchema } from "@/lib/schemas";
import { SCHOOL_CONFIG } from "@/constants";

const SCHOOL_INFO_ID = "school-config";

function defaultSchoolData() {
  return {
    id: SCHOOL_INFO_ID,
    schoolName: SCHOOL_CONFIG.name,
    shortName: SCHOOL_CONFIG.nameShort,
    abbrev: SCHOOL_CONFIG.abbrev,
    address: SCHOOL_CONFIG.address,
    addressFull: SCHOOL_CONFIG.addressFull,
    country: "Nepal",
    phone: SCHOOL_CONFIG.phone,
    email: SCHOOL_CONFIG.email,
    emailAlt: SCHOOL_CONFIG.emailAlt,
    website: SCHOOL_CONFIG.website,
    logoUrl: SCHOOL_CONFIG.logo,
    faviconUrl: SCHOOL_CONFIG.favicon,
  };
}

// GET /api/admin/school-information
// Any authenticated user can read (marksheets/transcripts/sidebar consume it).
export const GET = withHandler(async () => {
  let school = await prisma.schoolInformation.findUnique({
    where: { id: SCHOOL_INFO_ID },
  });

  if (!school) {
    school = await prisma.schoolInformation.create({ data: defaultSchoolData() });
  }

  return ok(school);
});

// PUT /api/admin/school-information (ADMIN only)
export const PUT = withHandler(
  async (req: NextRequest, { user }) => {
    const body = updateSchoolInformationSchema.parse(await req.json());

    const school = await prisma.schoolInformation.upsert({
      where: { id: SCHOOL_INFO_ID },
      update: { ...body, updatedBy: user.id },
      create: { ...defaultSchoolData(), ...body, updatedBy: user.id },
    });

    return ok(school, "School information updated");
  },
  ["ADMIN"],
);
