import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function flipScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export function flipScoreRating(score: number): string {
  if (score >= 90) return 'Exceptional'
  if (score >= 70) return 'Strong Flip'
  if (score >= 50) return 'Moderate'
  if (score >= 30) return 'Below Avg'
  return 'Poor'
}

export function conditionLabel(condition: string): string {
  const map: Record<string, string> = {
    new_sealed: 'New Sealed',
    used_complete: 'Used — Complete',
    used_incomplete: 'Used — Incomplete',
    parts_only: 'Parts Only',
  }
  return map[condition] ?? condition
}

export function subscriptionLabel(tier: string): string {
  const map: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    deal_scanner: 'Deal Scanner',
  }
  return map[tier] ?? 'Free'
}

export function roiColor(roi: number): string {
  if (roi >= 100) return 'text-green-600'
  if (roi >= 50) return 'text-emerald-500'
  if (roi >= 0) return 'text-yellow-500'
  return 'text-red-500'
}
