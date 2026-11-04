import { apiFetch } from './api'

// Book PDFs from the API (api/Books/BookPdfController.cs), in the page's
// language. Print opens the PDF in a new tab, where the browser's own print
// button works on phones and computers. Download saves the file.
//
// A target is the whole book, one recipe or secret, or the book's extra
// copies (only the pages picked for them, in one file).
//
// Each press is recorded for research (api/Books/BookPdfLogController.cs).
// The record is sent without waiting, so it never delays or blocks the PDF.

type PdfTarget = {
  bookId: string
  recipeId?: number
  secretId?: number
  extras?: boolean
}

type PdfAction = 'print' | 'download'

function pdfUrl({ bookId, recipeId, secretId, extras }: PdfTarget, download: boolean): string {
  const book = `/api/books/${encodeURIComponent(bookId)}`
  const path =
    recipeId !== undefined
      ? `${book}/recipes/${recipeId}/pdf`
      : secretId !== undefined
        ? `${book}/secrets/${secretId}/pdf`
        : extras
          ? `${book}/extras/pdf`
          : `${book}/pdf`
  const lang = document.documentElement.lang === 'es' ? 'es' : 'en'
  return `${path}?lang=${lang}${download ? '&download=1' : ''}`
}

function logPdf(action: PdfAction, { bookId, recipeId, secretId, extras }: PdfTarget) {
  apiFetch<{ ok: boolean }>(`/books/${encodeURIComponent(bookId)}/pdf-log`, {
    method: 'POST',
    body: { action, recipeId, secretId, extras: extras ?? false },
  }).catch(() => {})
}

export function printPdf(target: PdfTarget) {
  logPdf('print', target)
  window.open(pdfUrl(target, false), '_blank', 'noopener')
}

export function downloadPdf(target: PdfTarget) {
  logPdf('download', target)
  const link = document.createElement('a')
  link.href = pdfUrl(target, true)
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}