// src/app/api/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const [applications, resumes, coverLetters, interviews] = await Promise.all([
    prisma.application.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.resume.count({ where: { userId } }),
    prisma.coverLetter.count({ where: { userId } }),
    prisma.interview.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgScore =
    interviews.filter((i) => i.score !== null).length > 0
      ? Math.round(
          interviews.filter((i) => i.score !== null).reduce((s, i) => s + (i.score ?? 0), 0) /
            interviews.filter((i) => i.score !== null).length
        )
      : null;

  return NextResponse.json({
    applications,
    statusCounts,
    resumeCount: resumes,
    coverLetterCount: coverLetters,
    recentInterviews: interviews,
    avgInterviewScore: avgScore,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const { jobTitle, company, status, notes } = await req.json();
  const app = await prisma.application.create({
    data: { jobTitle, company, status: status || "applied", notes, userId },
  });

  return NextResponse.json(app, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, notes } = await req.json();
  const app = await prisma.application.update({
    where: { id },
    data: { status, notes },
  });

  return NextResponse.json(app);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
