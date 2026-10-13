import type { AllDataIconName } from '../alldata/AllDataIcons'

// What the Export page offers. Every format is built by
// GET /api/admin/all-data/export (api/Admin/AdminAllDataController.cs).

export type BundleFormat = {
  format: string
  label: string
  text: string
  icon: AllDataIconName
}

export const bundleFormats: BundleFormat[] = [
  {
    format: 'xlsx',
    label: 'Excel',
    text: 'Both files in one workbook, with column names in words. Also imports into SPSS.',
    icon: 'sheet',
  },
  {
    format: 'spss',
    label: 'SPSS',
    text: 'A zip ready for SPSS, with every question and answer labeled.',
    icon: 'layers',
  },
  {
    format: 'pdf',
    label: 'PDF',
    text: 'Both files in one PDF, for reading or printing.',
    icon: 'file',
  },
  {
    format: 'csv',
    label: 'CSV',
    text: 'A zip with books.csv and recipes-and-secrets.csv, for R, Python, or any tool.',
    icon: 'file',
  },
]

export const singleFormats: { format: string; label: string }[] = [
  { format: 'xlsx', label: 'Excel' },
  { format: 'csv', label: 'CSV' },
  { format: 'spss', label: 'SPSS' },
]

export const sheets: { id: 'books' | 'items'; label: string; text: string }[] = [
  { id: 'books', label: 'Books', text: 'One row per book' },
  { id: 'items', label: 'Recipes and secrets', text: 'One row per recipe or secret' },
]