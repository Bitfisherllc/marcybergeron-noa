/** Largest photo an admin can pick; the browser resizes it before the form is sent. */
export const ADMIN_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const ADMIN_UPLOAD_MAX_LABEL = "25 MB";
/** Keep in sync with `experimental.serverActions.bodySizeLimit` in next.config.ts (Vercel rejects bodies over 4.5 MB). */
export const ADMIN_UPLOAD_REQUEST_MAX_BYTES = 4 * 1024 * 1024;
/** All new files in one form together, leaving room for the text fields. */
export const ADMIN_UPLOAD_FORM_MAX_BYTES = ADMIN_UPLOAD_REQUEST_MAX_BYTES - 256 * 1024;
/** Resized images are re-encoded until they fit under this. */
export const ADMIN_UPLOAD_TARGET_BYTES = 1.8 * 1024 * 1024;
/** Long edge for web-sized images (browser and server). */
export const ADMIN_UPLOAD_MAX_EDGE = 2560;
/** Warn, but still allow the upload. Smaller images within the max edge are sent untouched. */
export const ADMIN_UPLOAD_WARN_BYTES = 500 * 1024;
export const ADMIN_UPLOAD_WARN_LABEL = "500 KB";
export const ADMIN_UPLOAD_HINT = `Large photos are automatically resized for the web (up to ${ADMIN_UPLOAD_MAX_LABEL}).`;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadTooLargeMessage(fileName: string, bytes: number): string {
  return `"${fileName}" is ${formatFileSize(bytes)}. Photos up to ${ADMIN_UPLOAD_MAX_LABEL} are resized automatically, but this one is larger. Export a smaller copy and try again.`;
}

export function uploadNotResizableMessage(fileName: string, bytes: number): string {
  return `"${fileName}" is ${formatFileSize(bytes)} and could not be resized automatically. Save it as a JPEG or PNG and try again.`;
}

export function uploadLargeFileWarning(fileName: string, bytes: number): string {
  return `"${fileName}" is ${formatFileSize(bytes)}. That is a large file and will take time for visitors to load. You can still save it. A file under ${ADMIN_UPLOAD_WARN_LABEL} is better when you have one.`;
}

export function uploadResizedNote(fromBytes: number, toBytes: number): string {
  return `Resized for the web from ${formatFileSize(fromBytes)} to ${formatFileSize(toBytes)}.`;
}

/** Returns a message when the new files in the form would exceed the request limit. */
export function findUploadProblemInForm(form: HTMLFormElement): string | null {
  let total = 0;
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    const file = input.files?.[0];
    if (!file) continue;
    if (file.size > ADMIN_UPLOAD_FORM_MAX_BYTES) return uploadNotResizableMessage(file.name, file.size);
    total += file.size;
  }
  if (total > ADMIN_UPLOAD_FORM_MAX_BYTES) {
    return `Together the new images here are ${formatFileSize(total)}, more than the ${formatFileSize(ADMIN_UPLOAD_FORM_MAX_BYTES)} that can be saved at once. Save a few of them, then add the rest.`;
  }
  return null;
}
