// src/app/api/mock-interview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInterviewQuestion, evaluateInterviewAnswer } from "@/lib/claude";

// POST /api/mock-interview — start session or get next question
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const { action, role, type, previousQA, question, answer, interviewId } = await req.json();

    // Start / next question
    if (action === "question") {
      const q = await generateInterviewQuestion({ role, type, previousQA });
      return NextResponse.json({ question: q });
    }

    // Evaluate an answer
    if (action === "evaluate") {
      const result = await evaluateInterviewAnswer({ role, type, question, answer });
      return NextResponse.json(result);
    }

    // Save completed session
    if (action === "save") {
      const { score, feedback, transcript } = await req.json().catch(() => ({}));
      const interview = await prisma.interview.create({
        data: {
          role,
          type,
          score,
          feedback,
          transcript: JSON.stringify(previousQA),
          userId,
        },
      });
      return NextResponse.json(interview, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Interview service error." }, { status: 500 });
  }
}

// PATCH — save/update a finished interview
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const { id, role, type, score, feedback, transcript } = await req.json();

  if (id) {
    const updated = await prisma.interview.update({
      where: { id },
      data: { score, feedback, transcript: JSON.stringify(transcript) },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.interview.create({
    data: { role, type, score, feedback, transcript: JSON.stringify(transcript), userId },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(interviews);
}
