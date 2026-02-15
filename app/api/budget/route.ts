import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      preferences: {
        select: {
          annualSalary: true,
          budgetMin: true,
          budgetMax: true,
        },
      },
    },
  });

  return NextResponse.json({ users });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (data.annualSalary != null && typeof data.annualSalary !== "number") {
    return NextResponse.json(
      { error: "annualSalary must be a number" },
      { status: 400 },
    );
  }

  const preferences = await prisma.userPreferences.update({
    where: { userId: session.userId },
    data: { annualSalary: data.annualSalary ?? null },
  });

  return NextResponse.json({ preferences });
}
