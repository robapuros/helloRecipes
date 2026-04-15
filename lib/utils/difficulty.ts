const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Fácil',
  1: 'Normal',
  2: 'Difícil',
  3: 'Experto',
}

const DIFFICULTY_COLORS: Record<number, string> = {
  0: 'text-green-600',
  1: 'text-amber-600',
  2: 'text-orange-600',
  3: 'text-red-600',
}

export function difficultyLabel(difficulty: number | null | undefined): string {
  if (difficulty === null || difficulty === undefined) return '—'
  return DIFFICULTY_LABELS[difficulty] ?? '—'
}

export function difficultyColor(difficulty: number | null | undefined): string {
  if (difficulty === null || difficulty === undefined) return 'text-muted-foreground'
  return DIFFICULTY_COLORS[difficulty] ?? 'text-muted-foreground'
}

export function difficultyDots(difficulty: number | null | undefined): number {
  if (difficulty === null || difficulty === undefined) return 0
  return Math.min(4, difficulty + 1)
}
