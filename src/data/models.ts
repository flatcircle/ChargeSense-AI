export interface Pincode {
  id: string
  pincode: string
  area: string
  district: string
  lat: number
  lng: number
  population: number
  evAdoptionIndex: number
  peakDemandMW: number
  availableCapacityMW: number
}

export interface ChargingStation {
  id: string
  pincodeId: string
  name: string
  operator: string
  chargerTypes: string
  portCount: number
  lat: number
  lng: number
  category: string
  dailyUtilization: number
  dailyEnergyKwh: number
  installedAt: Date
}

export interface DemandHotspot {
  id: string
  lat: number
  lng: number
  demandScore: number
  source: string
  notes: string | null
}

export interface ChargerProposal {
  id: string
  pincodeId: string
  proposedLat: number
  proposedLng: number
  category: string
  recommendedTypes: string
  recommendedPorts: number
  siteScore: number
  demandScore: number
  capacityScore: number
  accessibilityScore: number
  competitionScore: number
  v2gPotentialScore: number
  feederImpactPct: number
  feederCode: string | null
  estimatedDailyKwh: number
  estimatedRevenueInrPerMonth: number
  annualV2gRevenueInr: number
  paybackMonths: number
  fiveYearProfitInr: number
  rationale: string
  status: string
  createdAt: Date
}

export interface DemandForecast {
  id: string
  pincodeId: string
  hour: number
  predictedDemandKw: number
  isPeak: boolean
}
