import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { prisma } from "./db";

const SESSION_COOKIE = "firebase-token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  userId: string;
  username: string;
  isAdmin: boolean;
  displayName: string;
  email: string;
  photoURL: string | null;
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

    return {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      displayName: user.displayName,
      email: firebaseUser.email ?? "",
      photoURL: firebaseUser.photoURL ?? null,
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
}
