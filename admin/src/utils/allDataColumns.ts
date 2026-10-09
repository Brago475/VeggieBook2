import type { AllDataQuestion, AnswersView, ColumnGroup } from '../types/allData'
import { questionName, shortAnswer } from './answerNames'

// The columns the Books table shows on screen. The download always has
// every column; the screen can hide groups and show answers either as
// chips (one column per question) or as 0/1 columns (one per answer).

export type CellKind = 'id' | 'text' | 'num' | 'chips' | 'bin' | 'date' | 'time' | 'day' | 'subject'

export type DisplayColumn = {
  key: string
  group: ColumnGroup
  label: string
  small?: string
  title: string
  kind: CellKind
  question?: AllDataQuestion
}

export const groupLabels: Record<ColumnGroup, string> = {
  person: 'Person',
  book: 'Book',
  answers: 'Answers',
  items: 'Recipes and secrets',
}

export const groupOrder: ColumnGroup[] = ['person', 'book', 'answers', 'items']

const person: DisplayColumn[] = [
  { key: 'participant_id', group: 'person', label: 'Research ID', title: 'Anonymous research ID', kind: 'id' },
  { key: 'age_range', group: 'person', label: 'Age', title: 'Age range', kind: 'text' },
]

const book: DisplayColumn[] = [
  { key: 'book_no', group: 'book', label: 'Book no.', title: 'Book number for this person (1 = first)', kind: 'num' },
  { key: 'date', group: 'book', label: 'Date', title: 'Date saved (Eastern)', kind: 'date' },
  { key: 'time', group: 'book', label: 'Time', title: 'Time saved (Eastern)', kind: 'time' },
  { key: 'day', group: 'book', label: 'Day', title: 'Day of the week', kind: 'day' },
  { key: 'book_type', group: 'book', label: 'Type', title: 'Book type', kind: 'text' },
  { key: 'subject', group: 'book', label: 'Vegetable or category', title: 'Vegetable, or Secrets category', kind: 'subject' },
  { key: 'language', group: 'book', label: 'Language', title: 'Language', kind: 'text' },
  { key: 'cover', group: 'book', label: 'Cover', title: 'Built-in or personal cover', kind: 'text' },
]

const items: DisplayColumn[] = [
  { key: 'recipes_kept', group: 'items', label: 'Recipes kept', title: 'Recipes kept', kind: 'num' },
  { key: 'recipes_removed', group: 'items', label: 'Recipes out', title: 'Recipes taken out later', kind: 'num' },
  { key: 'secrets_kept', group: 'items', label: 'Secrets kept', title: 'Secrets kept', kind: 'num' },
  { key: 'secrets_removed', group: 'items', label: 'Secrets out', title: 'Secrets taken out later', kind: 'num' },
  { key: 'extra_copies', group: 'items', label: 'Extra copies', title: 'Extra copies', kind: 'num' },
]

function answerColumns(questions: AllDataQuestion[], view: AnswersView): DisplayColumn[] {
  const list: DisplayColumn[] =
    view === 'chips'
      ? questions.map((q) => ({
          key: `q${q.no}`,
          group: 'answers' as const,
          label: `Q${q.no} ${questionName(q.no)}`,
          title: `Q${q.no}. ${q.label}`,
          kind: 'chips' as const,
          question: q,
        }))
      : questions.flatMap((q) =>
          q.choices.map((c) => ({
            key: c.key,
            group: 'answers' as const,
            label: shortAnswer(c.text),
            small: `Q${q.no}`,
            title: `Q${q.no}. ${q.label} ${c.text} (1 = picked, 0 = not picked)`,
            kind: 'bin' as const,
          })),
        )
  list.push({ key: 'answers', group: 'answers', label: 'Picked', title: 'How many answers were picked', kind: 'num' })
  return list
}

export function bookColumns(
  questions: AllDataQuestion[],
  view: AnswersView,
  shown: Record<ColumnGroup, boolean>,
): DisplayColumn[] {
  const all = [...person, ...book, ...answerColumns(questions, view), ...items]
  // The research ID always stays, so every row can be told apart.
  return all.filter((c) => c.key === 'participant_id' || shown[c.group])
}