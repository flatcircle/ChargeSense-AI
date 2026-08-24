import { CHARGER_COSTS_INR, CHARGER_KW, TARIFF_INR_PER_KWH, COST_INR_PER_KWH, TARGET_UTILIZATION } from './types'
import type { ChargerType } from './types'

export interface RoiProjection {
  capexInr: number
  estimatedDailyKwh: number
  monthlyRevenueInr: number
  monthlyProfitInr: number
  annualV2gRevenueInr: number
  paybackMonths: number
  fiveYearProfitInr: number
}

export function projectRoi(
  chargerTypes: ChargerType[],
  portCount: number,
  demandScore: number,
  v2gPotentialScore: number,
): RoiProjection {
  const capexInr = chargerTypes.reduce((sum, t) => sum + CHARGER_COSTS_INR[t], 0) * portCount
  const avgKw = chargerTypes.reduce((sum, t) => sum + CHARGER_KW[t], 0) / chargerTypes.length
  
  // Utilization scaling based on demand
  const hoursPerDayInUse = 24 * TARGET_UTILIZATION * (0.5 + 0.5 * demandScore)
  const estimatedDailyKwh = avgKw * portCount * hoursPerDayInUse
  
  const monthlyRevenueInr = estimatedDailyKwh * TARIFF_INR_PER_KWH * 30
  const monthlyProfitInr = estimatedDailyKwh * (TARIFF_INR_PER_KWH - COST_INR_PER_KWH) * 30
  
  // V2G Revenue: only for DC chargers (bidirectional potential)
  const hasV2gSupport = chargerTypes.some(t => t.startsWith('DC_'))
  const annualV2gRevenueInr = hasV2gSupport 
    ? (avgKw * portCount * 2 * v2gPotentialScore * 365 * 1.5) // ₹1.5 per kWh V2G credit
    : 0

  const fiveYearProfitInr = (monthlyProfitInr * 60) + (annualV2gRevenueInr * 5) - capexInr
  const totalMonthlyInflow = monthlyProfitInr + (annualV2gRevenueInr / 12)
  const paybackMonths = totalMonthlyInflow > 0 ? capexInr / totalMonthlyInflow : Infinity

  return {
    capexInr: Math.round(capexInr),
    estimatedDailyKwh: Math.round(estimatedDailyKwh * 10) / 10,
    monthlyRevenueInr: Math.round(monthlyRevenueInr),
    monthlyProfitInr: Math.round(monthlyProfitInr),
    annualV2gRevenueInr: Math.round(annualV2gRevenueInr),
    paybackMonths: paybackMonths === Infinity ? 999 : Math.round(paybackMonths * 10) / 10,
    fiveYearProfitInr: Math.round(fiveYearProfitInr)
  }
}

export function fiveYearCumulativeProfit(monthlyProfitInr: number, annualV2gRevenueInr: number): number[] {
  const months = 60
  const result: number[] = []
  let cum = 0
  for (let i = 0; i < months; i++) {
    cum += monthlyProfitInr + (annualV2gRevenueInr / 12)
    result.push(cum)
  }
  return result
}
