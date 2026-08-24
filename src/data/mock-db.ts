import { generatePincodes, generateStations, generateHotspots } from './generate-mock-data'
import { generateHourlyForecast } from '../lib/forecast'
import { optimize } from '../lib/optimizer'
import type { Pincode, ChargingStation, DemandHotspot, DemandForecast, ChargerProposal } from './models'

// ID generator
let nextId = 1
const getId = () => `id_${nextId++}`

console.log('Generating initial mock data for ChargeSense AI...')

const rawPincodes = generatePincodes()
export const pincodes: (Pincode & { forecasts: DemandForecast[] })[] = rawPincodes.map((p) => {
  const pinId = getId()
  const forecastData = generateHourlyForecast(p.peakDemandMW, p.evAdoptionIndex)
  const forecasts = forecastData.map(f => ({
    id: getId(),
    pincodeId: pinId,
    hour: f.hour,
    predictedDemandKw: f.predictedDemandKw,
    isPeak: f.isPeak,
  }))
  
  return {
    ...p,
    id: pinId,
    forecasts,
  }
})

export const stations: ChargingStation[] = generateStations(rawPincodes as any).map(s => ({
  id: getId(),
  pincodeId: pincodes[s.pincodeIdx].id,
  name: s.name,
  operator: s.operator,
  chargerTypes: s.chargerTypes,
  portCount: s.portCount,
  lat: s.lat,
  lng: s.lng,
  category: s.category,
  dailyUtilization: s.dailyUtilization,
  dailyEnergyKwh: s.dailyEnergyKwh,
  installedAt: new Date(),
}))

export const hotspots: DemandHotspot[] = generateHotspots(rawPincodes as any).map(h => ({
  ...h,
  id: getId(),
}))

// Generate initial proposals
const result = optimize(
  { budgetInr: 50_000_000, maxPaybackMonths: 18, targetCount: 15 },
  pincodes,
  hotspots,
  stations
)

const statuses = [
  ...Array(8).fill('PROPOSED'),
  ...Array(3).fill('SHORTLISTED'),
  ...Array(2).fill('APPROVED'),
  ...Array(2).fill('DEPLOYED'),
]

export const proposals: (ChargerProposal & { pincode: Pincode })[] = result.proposals.map((p, i) => {
  const pincode = pincodes.find(pin => pin.id === p.pincodeId)!
  return {
    ...p,
    id: getId(),
    recommendedTypes: JSON.stringify(p.recommendedTypes),
    status: statuses[i] ?? 'PROPOSED',
    createdAt: new Date(),
    pincode
  }
})

export const MOCK_DB = {
  pincodes,
  stations,
  hotspots,
  proposals,
}
