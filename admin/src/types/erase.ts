// GET /api/admin/erase/{researchId} (api/Admin/AdminEraseController.cs).

export type ErasePreview = {
  researchId: string
  accountDeleted: boolean
  isAdmin: boolean
  booksInApp: number
  booksKept: number // deleted books kept for research
  trackingOn: boolean
  trackingChanges: number
  notices: number
}

export type EraseLevel = 'content' | 'account' | 'everything'

// POST /api/admin/erase
export type EraseResult = {
  level: EraseLevel
  booksErased: number
}