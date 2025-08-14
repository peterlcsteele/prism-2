/**
 * Core file I/O operations
 */
export async function readFile(path: string): Promise<string> {
  return await window.api.readFile({ path })
}

export async function writeFile(path: string, data: string): Promise<void> {
  await window.api.writeFile({ path, data })
}

export function showInFinder(path: string): void {
  window.api.showItemInFolder(path)
}
