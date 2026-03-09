import { getSession, setSession, clearSession } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { idToken } = (await req.json()) as { idToken?: string };

  if (!idToken) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const firebaseUser = await adminAuth.getUser(decoded.uid);

    // Look up or create Prisma user
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { preferences: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          username: firebaseUser.email ?? decoded.uid,
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? "User",
          passwordHash: "",
        },
        include: { preferences: true },
      });
    }

    await setSession(idToken);
    return Response.json({
      ok: true,
      uid: decoded.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? null,
      photoURL: firebaseUser.photoURL ?? null,
      onboardingComplete: user.preferences?.onboardingComplete ?? false,
    });
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ authenticated: false });
  }
  return Response.json({
    authenticated: true,
    uid: session.userId,
    email: session.email,
    displayName: session.displayName,
    photoURL: session.photoURL,
  });
}

export async function DELETE() {
  await clearSession();
  return Response.json({ ok: true });
}
