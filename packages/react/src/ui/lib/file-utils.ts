export type FilePreviewType = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'none';

/**
 * Determines the preview type for a given MIME type.
 */
export function getFilePreviewType(mimeType?: string): FilePreviewType {
  if (!mimeType) return 'none';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'none';
}

/**
 * Formats bytes into a human-readable file size string.
 * e.g. 2457600 => "2.4 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

/**
 * Extracts the file extension from a filename.
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Returns true if the MIME type is previewable in the browser.
 */
export function isPreviewable(mimeType?: string): boolean {
  const type = getFilePreviewType(mimeType);
  return type === 'image' || type === 'pdf';
}
