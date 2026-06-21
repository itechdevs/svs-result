import { NextResponse } from "next/server";

const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const url = `${EXTERNAL_API_URL}/api/sync/students`;
    console.log(`[DEBUG] Fetching from: ${url}`);

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `External API returned ${response.status}: ${response.statusText}`,
        url,
      });
    }

    const raw = await response.json();
    const data = Array.isArray(raw) ? raw : (raw?.data ?? []);

    // Return first 3 students with their full structure for debugging
    const sample = data.slice(0, 3).map((s: any) => ({
      id: s.id,
      name: s.name,
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      section: s.section,
      rollNumber: s.rollNumber,
      classroom: s.classroom,
      classroomName: s.classroom?.name,
      allKeys: Object.keys(s),
    }));

    return NextResponse.json({
      url,
      totalStudents: data.length,
      isArray: Array.isArray(raw),
      hasDataProperty: !Array.isArray(raw) && !!raw?.data,
      sampleStudents: sample,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      apiUrl: EXTERNAL_API_URL,
    });
  }
}
