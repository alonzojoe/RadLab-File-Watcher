import { useState, useEffect } from 'react'
import { TimeLeft } from '../types/index'
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds
} from 'date-fns'

const getManilaTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
}

const Timer = (): JSX.Element => {
  const START_DATE = new Date()

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getManilaTime()

      const days = Math.abs(differenceInDays(now, START_DATE))
      const hours = Math.abs(differenceInHours(now, START_DATE) % 24)
      const minutes = Math.abs(differenceInMinutes(now, START_DATE) % 60)
      const seconds = Math.abs(differenceInSeconds(now, START_DATE) % 60)

      setTimeLeft({ days, hours, minutes, seconds })
    }, 1000)

    return (): void => clearInterval(timer)
  }, [])

  const DAYS = timeLeft.days.toString().padStart(2, '0')
  const HOURS = timeLeft.hours.toString().padStart(2, '0')
  const MINUTES = timeLeft.minutes.toString().padStart(2, '0')
  const SECONDS = timeLeft.seconds.toString().padStart(2, '0')

  const Formmated_Timer = `${DAYS}:${HOURS}:${MINUTES}:${SECONDS}`

  return (
    <>
      <div className="border border-primary rounded-2xl py-3 text-center">
        <h1 className="font-bold text-5xl">{Formmated_Timer}</h1>
      </div>
      <h2 className="text-center text-textSecondary">Connecting time</h2>
    </>
  )
}

export default Timer
