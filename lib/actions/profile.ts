"use server";

import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/db";

export async function uploadAvatar(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  if (!file.type.startsWith("image/")) throw new Error("File must be an image");
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5MB");

  const ext = file.name.split(".").pop() ?? "jpg";

  // Look up Firebase UID from Prisma user
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { firebaseUid: true },
  });
  if (!user?.firebaseUid) throw new Error("User not linked to Firebase");

  const path = `${user.firebaseUid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  await adminAuth.updateUser(user.firebaseUid, {
    photoURL: urlData.publicUrl,
  });

  return { photoURL: urlData.publicUrl };
}
