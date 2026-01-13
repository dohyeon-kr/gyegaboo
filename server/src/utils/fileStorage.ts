import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';

const sharedDir = join(process.cwd(), 'shared');
const uploadsDir = join(sharedDir, 'uploads');
const profilesDir = join(uploadsDir, 'profiles');
const receiptsDir = join(uploadsDir, 'receipts');

// 디렉토리 생성 (없는 경우)
async function ensureDirectory(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * 파일 확장자를 MIME 타입에서 추출
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return mimeMap[mimeType] || 'jpg';
}

/**
 * 프로필 이미지를 저장하고 경로를 반환
 */
export async function saveProfileImage(
  buffer: Buffer,
  userId: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  await ensureDirectory(profilesDir);
  
  const extension = getExtensionFromMimeType(mimeType);
  const filename = `${userId}-${randomBytes(8).toString('hex')}.${extension}`;
  const filePath = join(profilesDir, filename);
  
  await writeFile(filePath, buffer);
  
  // 상대 경로 반환 (클라이언트에서 접근 가능하도록)
  return `/uploads/profiles/${filename}`;
}

/**
 * 영수증 이미지를 저장하고 경로를 반환
 */
export async function saveReceiptImage(
  buffer: Buffer,
  expenseId: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  await ensureDirectory(receiptsDir);
  
  const extension = getExtensionFromMimeType(mimeType);
  const filename = `${expenseId}-${randomBytes(8).toString('hex')}.${extension}`;
  const filePath = join(receiptsDir, filename);
  
  await writeFile(filePath, buffer);
  
  // 상대 경로 반환 (클라이언트에서 접근 가능하도록)
  return `/uploads/receipts/${filename}`;
}

/**
 * 파일 경로를 절대 경로로 변환
 */
export function getFilePath(relativePath: string): string {
  if (relativePath.startsWith('/uploads/')) {
    return join(sharedDir, relativePath);
  }
  return join(uploadsDir, relativePath);
}
