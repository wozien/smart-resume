'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function padMonth(month: number) {
  return String(month).padStart(2, '0')
}

export function formatMonthValue(year: number, month: number) {
  return `${year}.${padMonth(month)}`
}

export function parseMonthValue(value: string) {
  const match = value.trim().match(/^(\d{4})[./-](\d{1,2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (year < 1970 || year > 2100 || month < 1 || month > 12) return null
  return { year, month }
}

export function MonthPicker({
  id,
  value,
  onChange,
  placeholder = '选择月份',
  allowPresent = false,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowPresent?: boolean
}) {
  const parsed = parseMonthValue(value)
  const present = allowPresent && value.trim() === ''
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => parsed?.year ?? new Date().getFullYear())

  const display = useMemo(() => {
    if (present) return '至今'
    if (parsed) return formatMonthValue(parsed.year, parsed.month)
    return ''
  }, [parsed, present])

  function selectMonth(month: number) {
    onChange(formatMonthValue(viewYear, month))
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setViewYear(parsed?.year ?? new Date().getFullYear())
      }}
    >
      <PopoverTrigger
        id={id}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg border border-input bg-white px-2.5 text-sm outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          display ? 'text-[#14152B]' : 'text-muted-foreground',
        )}
      >
        <span className="truncate">{display || placeholder}</span>
        <CalendarDays className="size-4 shrink-0 text-[#8C8FA8]" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-3 p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-[#565A78] hover:bg-[#F6F7FB]"
            aria-label="上一年"
            onClick={() => setViewYear((year) => year - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="text-sm font-semibold text-[#14152B]">{viewYear} 年</p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-[#565A78] hover:bg-[#F6F7FB]"
            aria-label="下一年"
            onClick={() => setViewYear((year) => year + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((month) => {
            const selected = parsed?.year === viewYear && parsed.month === month
            return (
              <button
                key={month}
                type="button"
                className={cn(
                  'h-9 rounded-lg text-sm text-[#565A78] hover:bg-[#F6F7FB]',
                  selected && 'bg-[#EEF0FF] font-semibold text-[#5A6ACF] hover:bg-[#EEF0FF]',
                )}
                onClick={() => selectMonth(month)}
              >
                {month} 月
              </button>
            )
          })}
        </div>
        {allowPresent ? (
          <button
            type="button"
            className={cn(
              'h-9 w-full rounded-lg text-sm hover:bg-[#F6F7FB]',
              present ? 'bg-[#EEF0FF] font-semibold text-[#5A6ACF]' : 'text-[#565A78]',
            )}
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
          >
            至今
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
