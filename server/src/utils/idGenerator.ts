/**
 * 고유한 ID를 생성합니다
 */
export function generateUniqueId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}-${extraRandom}`;
}

/**
 * 여러 개의 고유한 ID를 생성합니다
 */
export function generateUniqueIds(count: number): string[] {
  const ids: string[] = [];
  const usedIds = new Set<string>();
  
  while (ids.length < count) {
    const id = generateUniqueId();
    if (!usedIds.has(id)) {
      usedIds.add(id);
      ids.push(id);
    }
  }
  
  return ids;
}
