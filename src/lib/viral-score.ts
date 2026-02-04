/**
 * Viral Score Calculation Algorithm
 *
 * The viral score is a composite metric that identifies high-performing content
 * based on multiple factors weighted for their importance in predicting virality.
 *
 * Factors:
 * 1. Absolute Engagement (20%) - Raw engagement numbers show total reach
 * 2. Engagement Rate (30%) - Engagement relative to follower count
 * 3. Velocity (25%) - Engagement in first 24 hours indicates viral potential
 * 4. Share Ratio (25%) - Shares are the strongest indicator of virality
 */

export interface ViralScoreInput {
  views: number | bigint
  likes: number | bigint
  comments: number | bigint
  shares: number | bigint
  saves: number | bigint
  followerCount: number
  firstDayEngagement?: number | bigint
  firstDayViews?: number | bigint
}

export interface ViralScoreResult {
  totalScore: number
  breakdown: {
    absoluteEngagement: number
    engagementRate: number
    velocity: number
    shareRatio: number
  }
  tier: 'viral' | 'high' | 'average' | 'low'
}

// Weights for each factor
const WEIGHTS = {
  absoluteEngagement: 0.20,
  engagementRate: 0.30,
  velocity: 0.25,
  shareRatio: 0.25,
}

// Benchmarks for normalization (based on typical social media performance)
const BENCHMARKS = {
  // High performer thresholds
  highEngagement: 100000,  // 100K total engagement is considered high
  highEngagementRate: 5,   // 5% engagement rate is excellent
  highVelocityRatio: 0.7,  // 70% of engagement in first 24h
  highShareRatio: 0.15,    // 15% share ratio is very high
}

export function calculateViralScore(input: ViralScoreInput): ViralScoreResult {
  const views = Number(input.views)
  const likes = Number(input.likes)
  const comments = Number(input.comments)
  const shares = Number(input.shares)
  const saves = Number(input.saves)
  const firstDayEngagement = Number(input.firstDayEngagement || 0)
  const { followerCount } = input

  // Total engagement
  const totalEngagement = likes + comments + shares + saves

  // 1. Absolute Engagement Score (0-100)
  // Uses logarithmic scaling to handle large ranges
  const absoluteEngagementScore = Math.min(
    100,
    (Math.log10(Math.max(totalEngagement, 1)) / Math.log10(BENCHMARKS.highEngagement)) * 100
  )

  // 2. Engagement Rate Score (0-100)
  const engagementRate = followerCount > 0
    ? (totalEngagement / followerCount) * 100
    : 0
  const engagementRateScore = Math.min(
    100,
    (engagementRate / BENCHMARKS.highEngagementRate) * 100
  )

  // 3. Velocity Score (0-100)
  // How much engagement happened in the first 24 hours
  let velocityScore = 0
  if (totalEngagement > 0 && firstDayEngagement > 0) {
    const velocityRatio = firstDayEngagement / totalEngagement
    velocityScore = Math.min(
      100,
      (velocityRatio / BENCHMARKS.highVelocityRatio) * 100
    )
  } else {
    // If no first-day data, use 50 as neutral score
    velocityScore = 50
  }

  // 4. Share Ratio Score (0-100)
  // Shares are the strongest indicator of viral potential
  const shareRatio = totalEngagement > 0
    ? shares / totalEngagement
    : 0
  const shareRatioScore = Math.min(
    100,
    (shareRatio / BENCHMARKS.highShareRatio) * 100
  )

  // Calculate weighted total score
  const totalScore =
    absoluteEngagementScore * WEIGHTS.absoluteEngagement +
    engagementRateScore * WEIGHTS.engagementRate +
    velocityScore * WEIGHTS.velocity +
    shareRatioScore * WEIGHTS.shareRatio

  // Determine tier
  let tier: ViralScoreResult['tier']
  if (totalScore >= 75) {
    tier = 'viral'
  } else if (totalScore >= 50) {
    tier = 'high'
  } else if (totalScore >= 25) {
    tier = 'average'
  } else {
    tier = 'low'
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    breakdown: {
      absoluteEngagement: Math.round(absoluteEngagementScore * 10) / 10,
      engagementRate: Math.round(engagementRateScore * 10) / 10,
      velocity: Math.round(velocityScore * 10) / 10,
      shareRatio: Math.round(shareRatioScore * 10) / 10,
    },
    tier,
  }
}

/**
 * Calculate engagement rate for a post
 */
export function calculateEngagementRate(
  likes: number | bigint,
  comments: number | bigint,
  shares: number | bigint,
  followerCount: number
): number {
  if (followerCount === 0) return 0
  const totalEngagement = Number(likes) + Number(comments) + Number(shares)
  return Math.round((totalEngagement / followerCount) * 10000) / 100 // 2 decimal places
}

/**
 * Get performance comparison against brand average
 */
export function getPerformanceComparison(
  postEngagement: number,
  brandAverage: number
): { percentage: number; label: string } {
  if (brandAverage === 0) {
    return { percentage: 0, label: 'No data' }
  }

  const percentage = ((postEngagement - brandAverage) / brandAverage) * 100
  const roundedPercentage = Math.round(percentage)

  if (roundedPercentage > 50) {
    return { percentage: roundedPercentage, label: 'Exceptional' }
  } else if (roundedPercentage > 20) {
    return { percentage: roundedPercentage, label: 'Above average' }
  } else if (roundedPercentage > -20) {
    return { percentage: roundedPercentage, label: 'Average' }
  } else {
    return { percentage: roundedPercentage, label: 'Below average' }
  }
}
