import { writeFile } from './fileService'

/**
 * Transform data based on export format
 */
export function transformDataForExport(format: string, data: string): string {
  switch (format) {
    case 'html':
      return `<html><head></head><body>${String(data).toUpperCase()}</body></html>`
    case 'canvas':
    case 'learn9':
    case 'moodle':
      // TODO: Implement specific transformations for these formats
      return data
    default:
      return data
  }
}

/**
 * Export file with format transformation
 */
export async function exportFile(format: string, path: string, data: string): Promise<void> {
  const transformedData = transformDataForExport(format, data)
  await writeFile(path, transformedData)
}
