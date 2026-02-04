'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OnThisDayView } from '@/components/on-this-day/on-this-day-view'
import type { OnThisDayData } from '@/types'

interface OnThisDayResponse {
  success: boolean
  data: OnThisDayData
}

export default function OnThisDayPage() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const { data, isLoading } = useQuery<OnThisDayResponse>({
    queryKey: ['on-this-day', currentDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const res = await fetch(
        `/api/on-this-day?date=${currentDate.toISOString()}`
      )
      return res.json()
    },
  })

  return (
    <OnThisDayView
      data={data?.data || null}
      isLoading={isLoading}
      onDateChange={setCurrentDate}
    />
  )
}
