/** Keep in sync with `experimental.serverActions.bodySizeLimit` in next.config.ts */
export const ADMIN_UPLOAD_MAX_BYTES = 12 * 1024 * 1024;
export const ADMIN_UPLOAD_MAX_LABEL = "12 MB";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadTooLargeMessage(fileName: string, bytes: number): string {
  return `"${fileName}" is ${formatFileSize(bytes)}. The maximum upload size is ${ADMIN_UPLOAD_MAX_LABEL}. Choose a smaller file or pick an existing site image.`;
}

export function findOversizedUploadInForm(form: HTMLFormElement): { name: string; size: number } | null {
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    const file = input.files?.[0];
    if (file && file.size > ADMIN_UPLOAD_MAX_BYTES) {
      return { name: file.name, size: file.size };
    }
  }
  return null;
}
