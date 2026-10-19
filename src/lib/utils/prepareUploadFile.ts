import { sanitizeImage } from "../../../convex/lib/imageContent";
/** Strip image location metadata before hashing and uploading; documents are unchanged. */
export async function prepareUploadFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const clean = sanitizeImage(
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  );
  return new File([clean as BlobPart], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
