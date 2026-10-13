// Fixed lists for the Export page.

export const allFormats: { format: string; label: string }[] = [
  { format: 'xlsx', label: 'Excel' },
  { format: 'spss', label: 'SPSS' },
  { format: 'csv', label: 'CSV' },
  { format: 'pdf', label: 'PDF' },
]

export const studyFormats = [...allFormats, { format: 'zip', label: 'ZIP' }]

export const zipContents = [
  'Excel workbook',
  'Books CSV',
  'Recipes and secrets CSV',
  'SPSS files',
  'README',
]

export const bundleFiles: { id: string; label: string }[] = [
  { id: 'books', label: 'Books' },
  { id: 'items', label: 'Recipes and secrets' },
  { id: 'participants', label: 'Participants' },
  { id: 'codebook', label: 'Question codebook' },
  { id: 'content', label: 'Content library' },
]

export const bundleFormats: { id: string; label: string }[] = [
  { id: 'xlsx', label: 'Excel' },
  { id: 'csv', label: 'CSV' },
  { id: 'spss', label: 'SPSS' },
  { id: 'pdf', label: 'PDF' },
]

export const formatGuide: { name: string; text: string }[] = [
  { name: 'Excel', text: 'Easiest to read. Column names in words. Also opens in SPSS.' },
  { name: 'SPSS', text: 'Ready to analyze, with every question and answer labeled.' },
  { name: 'CSV', text: 'Plain data for R, Python, or any tool.' },
  { name: 'PDF', text: 'For reading or printing, not for analysis.' },
  { name: 'ZIP', text: 'Everything together, with a README.' },
]