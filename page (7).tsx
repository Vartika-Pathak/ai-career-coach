// src/app/api/generate-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResume } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const { userBackground, jobTitle, company, jobDescription } = await req.json();

    if (!userBackground || !jobTitle) {
      return NextResponse.json({ error: "userBackground and jobTitle are required." }, { status: 400 });
    }

    const content = await generateResume({ userBackground, jobTitle, company, jobDescription });

    const resume = await prisma.resume.create({
      data: {
        title: `${jobTitle}${company ? ` – ${company}` : ""}`,
        jobTitle,
        company,
        content,
        jobDesc: jobDescription,
        userId,
      },
    });

    return NextResponse.json(resume, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate resume." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resumes);
}
