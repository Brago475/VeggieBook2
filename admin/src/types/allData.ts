import type { SheetColumn, SheetRow } from './research'

// Shapes of the All Data API (api/Admin/AdminAllDataController.cs and
// api/Research/AllData/). If those change, change these to match.

// books = file 1, one row per book. items = file 2, one row per recipe
// or secret.
export type AllDataFile = 'books' | 'items'

export type AllDataSheet = {
  name: AllDataFile
  title: string
  generatedAt: string
  columns: SheetColumn[]
  rows: SheetRow[]
}

// GET /api/admin/all-data/questions
export type AllDataChoice = {
  key: string // the 0/1 column, such as q1_2
  text: string
}

export type AllDataQuestion = {
  no: number
  label: string
  choices: AllDataChoice[]
}

// Page controls.
export type BookTypeFilter = '' | 'VeggieBook' | 'Secrets Book'
export type ItemStatusFilter = 'all' | 'kept' | 'out'
export type AnswersView = 'chips' | 'binary'
export type ColumnGroup = 'person' | 'book' | 'answers' | 'items'