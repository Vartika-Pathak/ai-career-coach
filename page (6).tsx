// src/app/api/generate-cover-letter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const { userBackground, jobTitle, company, jobDescription } = await req.json();

    if (!userBackground || !jobTitle) {
      return NextResponse.json({ error: "userBackground and jobTitle are required." }, { status: 400 });
    }

    const content = await generateCoverLetter({ userBackground, jobTitle, company, jobDescription });

    const letter = await prisma.coverLetter.create({
      data: {
        title: `${jobTitle}${company ? ` – ${company}` : ""}`,
        jobTitle,
        company,
        content,
        jobDesc: jobDescription,
        userId,
      },
    });

    return NextResponse.json(letter, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate cover letter." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const letters = await prisma.coverLetter.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(letters);
}
