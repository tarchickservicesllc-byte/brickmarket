'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { flipScoreColor, flipScoreRating } from '@/lib/utils'

interface Props {
  score: number
  size?: number
  showLabel?: boolean
}

export default function FlipScoreGauge({ score, size = 160, showLabel = true }: Props) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const radius = (size / 2) - 16
  const circumference = 2 * Math.PI * radius
  // Arc from 135deg to 405deg (270deg sweep)
  const sweep = 270
  const sweepRadians = (sweep / 360) * circumference
  const offset = circumference - (displayed / 100) * sweepRadians
  const color = flipScoreColor(displayed)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size * 0.75 }}>
        <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`} className="absolute top-0 left-0" style={{ overflow: 'visible' }}>
          {/* Background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={12}
            strokeDasharray={`${sweepRadians} ${circumference - sweepRadians}`}
            strokeDashoffset={circumference * (90 / 360)}
            strokeLinecap="round"
            transform={`rotate(135 ${size / 2} ${size / 2})`}
          />
          {/* Colored arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeDasharray={`${sweepRadians} ${circumference - sweepRadians}`}
            strokeDashoffset={circumference * (90 / 360)}
            strokeLinecap="round"
            transform={`rotate(135 ${size / 2} ${size / 2})`}
            initial={{ strokeDashoffset: sweepRadians + circumference * (90 / 360) }}
            animate={{ strokeDashoffset: offset + circumference * (90 / 360) - sweepRadians }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '10%' }}>
          <motion.span
            className="font-black leading-none"
            style={{ fontSize: size * 0.28, color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {displayed}
          </motion.span>
          {showLabel && (
            <span className="text-xs text-gray-400 font-medium mt-0.5">{flipScoreRating(displayed)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
