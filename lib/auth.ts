import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { prisma } from "./db";

const SESSION_COOKIE = "firebase-token";
const TEAM_COOKIE = "active-team";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type TeamRole = "owner" | "collaborator" | "viewer";

export interface SessionUser {
  userId: string;
  username: string;
  isAdmin: boolean;
  displayName: string;
  email: string;
  photoURL: string | null;
  sharedUserId: string;
  activeTeamId: string;
  teamRole: TeamRole;
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const firebaseUser = await adminAuth.getUser(decoded.uid);

    // Look up Prisma user by Firebase UID
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    // Auto-create user if not found
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          username: firebaseUser.email ?? decoded.uid,
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? "User",
          passwordHash: "",
        },
      });
    }

    const email = firebaseUser.email ?? "";
    const displayName = firebaseUser.displayName ?? user.displayName;
    const photoURL = firebaseUser.photoURL ?? null;

    // Upsert shared_users record
    const sharedUser = await prisma.sharedUser.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        firebaseUid: decoded.uid,
        email,
        displayName,
        photoUrl: photoURL,
      },
      update: {
        email,
        displayName,
        photoUrl: photoURL,
      },
    });

    // Link housing user to shared user if not already linked
    if (!user.sharedUserId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { sharedUserId: sharedUser.id },
      });
    }

    // Get user's team memberships
    let memberships = await prisma.sharedTeamMember.findMany({
      where: { userId: sharedUser.id },
      include: { team: true },
    });

    // Auto-create personal team if none exist
    if (memberships.length === 0) {
      await prisma.sharedTeam.create({
        data: {
          name: `${displayName || email}'s Team`,
          createdBy: sharedUser.id,
          members: {
            create: {
              userId: sharedUser.id,
              role: "owner",
            },
          },
        },
      });
      memberships = await prisma.sharedTeamMember.findMany({
        where: { userId: sharedUser.id },
        include: { team: true },
      });
    }

    // Resolve active team from cookie
    const activeTeamCookie = jar.get(TEAM_COOKIE)?.value;
    let activeMembership = activeTeamCookie
      ? memberships.find((m) => m.teamId === activeTeamCookie)
      : null;
    if (!activeMembership) {
      activeMembership = memberships[0];
    }

    return {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      displayName: user.displayName,
      email,
      photoURL,
      sharedUserId: sharedUser.id,
      activeTeamId: activeMembership.teamId,
      teamRole: activeMembership.role as TeamRole,
    };
  } catch {
    return null;
  }
}

export async function setSession(idToken: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(TEAM_COOKIE);
}

export function assertCanWrite(session: SessionUser): Response | null {
  if (session.teamRole === "viewer") {
    return new Response(
      JSON.stringify({ error: "Viewers cannot modify data" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}

export function withAuth(
  handler: (
    request: Request,
    context: { session: SessionUser; params?: any },
  ) => Promise<Response>,
) {
  return async (request: Request, routeContext?: any): Promise<Response> => {
    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const params = routeContext?.params
      ? await routeContext.params
      : undefined;
    return handler(request, { session, params });
  };
}
