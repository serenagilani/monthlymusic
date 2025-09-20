let memoryStore: Record<string, string> = {};

export async function storageGet(key: string) {
  return memoryStore[key] ?? null;
}

export async function storageSet(key: string, value: string) {
  memoryStore[key] = value;
}
