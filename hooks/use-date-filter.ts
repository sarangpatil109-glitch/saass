import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format, subDays, startOfMonth, startOfYear, subMonths, endOfMonth } from 'date-fns'

export type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

export function useDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  })

  // Try to determine the active preset based on current URLs
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('all')

  useEffect(() => {
    // Basic heuristic to detect active preset if not 'custom'
    if (!from && !to) {
      setSelectedPreset('all')
    } else {
      // In a real app we might reverse engineer the exact preset by comparing dates,
      // but for simplicity we can just leave it as 'custom' if it doesn't easily match.
      // We will rely on user clicking the presets to update both URL and preset state simultaneously.
      // But we still need to parse the initial load.
      setSelectedPreset('custom')
    }
  }, [from, to])

  const applyPreset = (preset: DatePreset) => {
    setSelectedPreset(preset)
    const today = new Date()
    let newFrom: Date | undefined = undefined
    let newTo: Date | undefined = undefined

    switch (preset) {
      case 'today':
        newFrom = today
        newTo = today
        break
      case 'yesterday':
        newFrom = subDays(today, 1)
        newTo = subDays(today, 1)
        break
      case 'last7':
        newFrom = subDays(today, 7)
        newTo = today
        break
      case 'last30':
        newFrom = subDays(today, 30)
        newTo = today
        break
      case 'thisMonth':
        newFrom = startOfMonth(today)
        newTo = today
        break
      case 'lastMonth':
        const lastM = subMonths(today, 1)
        newFrom = startOfMonth(lastM)
        newTo = endOfMonth(lastM)
        break
      case 'thisYear':
        newFrom = startOfYear(today)
        newTo = today
        break
      case 'all':
        newFrom = undefined
        newTo = undefined
        break
      case 'custom':
        return // handled directly by setDateRange
    }

    updateUrl(newFrom, newTo)
  }

  const updateUrl = (newFrom: Date | undefined, newTo: Date | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newFrom) {
      params.set('from', format(newFrom, 'yyyy-MM-dd'))
    } else {
      params.delete('from')
    }
    
    if (newTo) {
      params.set('to', format(newTo, 'yyyy-MM-dd'))
    } else {
      params.delete('to')
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleSetDateRange = (range: { from: Date | undefined, to?: Date | undefined } | undefined) => {
    if (!range) {
      updateUrl(undefined, undefined)
      setSelectedPreset('all')
      return
    }
    
    updateUrl(range.from, range.to)
    setSelectedPreset('custom')
  }

  return {
    dateRange: {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    },
    setDateRange: handleSetDateRange,
    selectedPreset,
    applyPreset
  }
}
