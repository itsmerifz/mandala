import React from 'react'
import { Badge } from './ui/badge'

const RatingBadge = ({ ratingName }: { ratingName: string}) => {
  const ratingLibs = [
    { name: 'OBS', color: 'bg-red-500' },
    { name: 'S1', color: 'bg-orange-500' },
    { name: 'S2', color: 'bg-yellow-500' },
    { name: 'S3', color: 'bg-green-500' },
    { name: 'C1', color: 'bg-blue-500' },
    { name: 'C2', color: 'bg-teal-500' },
    { name: 'C3', color: 'bg-purple-500' },
    { name: 'I1', color: 'bg-pink-500' },
    { name: 'I2', color: 'bg-rose-500' },
    { name: 'I3', color: 'bg-emerald-500' },
    { name: 'SUP', color: 'bg-lime-500' },
    { name: 'ADM', color: 'bg-gray-500' }
  ]

  const matchedRating = ratingLibs.find(rating => rating.name === ratingName)
  const ratingColor = matchedRating?.color || 'bg-gray-300'

  return (
    <Badge className={`dark:text-white *:text-black ${ratingColor} w-12`}>{ratingName}</Badge>
  )
}

export default RatingBadge