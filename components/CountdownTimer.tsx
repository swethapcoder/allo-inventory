'use client'

import { useEffect, useState } from 'react'

interface Props {
  expiresAt: string
}

export default function CountdownTimer({ expiresAt }: Props) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now()

      if (diff <= 0) {
        setTimeLeft('Expired')
        clearInterval(interval)
        return
      }

      const minutes = Math.floor(diff / 1000 / 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setTimeLeft(
        `${minutes}:${seconds.toString().padStart(2, '0')}`,
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div className="text-lg font-semibold">
      Time Remaining: {timeLeft}
    </div>
  )
}