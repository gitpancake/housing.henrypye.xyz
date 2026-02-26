import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET = "listing-photos";

export interface UploadResult {
    urls: string[];
    error?: { message: string; status: number };
}

/**
 * Validate and upload photos to Supabase Storage.
 * @param files - Files from formData.getAll("photos")
 * @param pathPrefix - Storage path prefix (e.g. "listing-id" or "viewing-notes/vid/nid")
 */
export async function uploadPhotos(
    files: File[],
    pathPrefix: string,
): Promise<UploadResult> {
    if (files.length === 0) {
        return { urls: [], error: { message: "No files provided", status: 400 } };
    }

    const urls: string[] = [];

    for (const file of files) {
        if (!file.type.startsWith("image/")) {
            return {
                urls: [],
                error: { message: `Invalid file type: ${file.type}`, status: 400 },
            };
        }

        if (file.size > MAX_FILE_SIZE) {
            return {
                urls: [],
                error: {
                    message: `File too large: ${file.name} (max 10MB)`,
                    status: 400,
                },
            };
        }

        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("Supabase upload error:", error);
            return {
                urls: [],
                error: { message: `Upload failed: ${error.message}`, status: 500 },
            };
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(fileName);

        urls.push(urlData.publicUrl);
    }

    return { urls };
}
