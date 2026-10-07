// Shapes of the research API (api/Admin/AdminResearchController.cs and
// api/Research/SheetModel.cs). If those change, change these to match.

export type SheetName = 'responses' | 'participants'

export type SheetColumn = {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'time'
  values: string[] | null
}

export type SheetRow = Record<string, string | number | null>

export type Sheet = {
  name: SheetName
  title: string
  generatedAt: string
  columns: SheetColumn[]
  rows: SheetRow[]
}

// GET /api/admin/research/options
export type ResearchOptions = {
  ageRanges: string[]
  vegetables: { code: string; name: string }[]
}

// The page's filters. Empty string means "no filter". Dates are
// yyyy-MM-dd, Eastern.
export type ResearchFilters = {
  from: string
  to: string
  age: string
  vegetable: string
}

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'spss'