

export interface HourlyForecast {
  hour: number
  predictedDemandKw: number
  isPeak: boolean
}

// Simulated LSTM-based forecasting logic
// In a real app, this would call a Python microservice or use a WASM-based ONNX model
export function generateHourlyForecast(
  baseDemandMW: number,
  evAdoptionIndex: number,
): Array<{ hour: number; predictedDemandKw: number; isPeak: boolean }> {
  const forecast = []
  
  // Standard diurnal load curve for Indore (peaks at 11 AM and 8 PM)
  const diurnalPattern = [
    0.3, 0.25, 0.2, 0.2, 0.25, 0.4,   // 0-5
    0.6, 0.8, 0.95, 1.0, 0.9, 0.85,  // 6-11
    0.8, 0.75, 0.7, 0.75, 0.85, 0.95, // 12-17
    1.0, 0.95, 0.8, 0.6, 0.45, 0.35  // 18-23
  ]

  for (let hour = 0; hour < 24; hour++) {
    // Add some noise and scale by base demand + EV adoption
    const noise = 1 + (Math.random() - 0.5) * 0.1
    const multiplier = diurnalPattern[hour] * noise
    const predictedDemandKw = baseDemandMW * 1000 * multiplier * (1 + evAdoptionIndex * 0.2)
    
    // Peak load window for MPPKVVCL is typically 6 PM - 10 PM
    const isPeak = hour >= 18 && hour <= 22

    forecast.push({
      hour,
      predictedDemandKw: Math.round(predictedDemandKw * 10) / 10,
      isPeak
    })
  }

  return forecast
}

export function getPeakShiftingRecommendation(hour: number, predictedDemandKw: number, capacityKw: number): string | null {
  const utilization = predictedDemandKw / capacityKw
  if (utilization > 0.8) {
    return "CRITICAL: Feeder stress detected. Recommend shifting non-essential charging to 11 PM - 6 AM window for 15% tariff rebate."
  }
  if (utilization > 0.6) {
    return "WARNING: High load window. Opt-in for managed charging to earn grid-stabilization credits."
  }
  return null
}
