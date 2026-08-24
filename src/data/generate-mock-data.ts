/**
 * Generate mock geo data for ChargeSense AI.
 * 30 Indore pincodes/zones with realistic lat/lng, 40 existing charging stations,
 * 60 demand hotspots concentrated near IT corridors, malls, highway bypasses, and industrial zones.
 */

import { faker } from '@faker-js/faker'

faker.seed(42)

type Pincode = {
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

type Station = {
  pincodeIdx: number
  name: string
  operator: string
  chargerTypes: string
  portCount: number
  lat: number
  lng: number
  category: string
  dailyUtilization: number
  dailyEnergyKwh: number
}

type Hotspot = {
  lat: number
  lng: number
  demandScore: number
  source: string
  notes: string
}

// 30 Indore zones — pincode + area + district + approx lat/lng
const INDORE_PINCODES: Array<[string, string, string, number, number]> = [
  ['452001', 'MG Road / Old Palasia', 'Indore Urban', 22.7244, 75.8839],
  ['452002', 'Rajwada / Sarafa Bazaar', 'Indore Urban', 22.7186, 75.8554],
  ['452003', 'Vallabh Nagar / Tukoganj', 'Indore Urban', 22.7275, 75.8741],
  ['452004', 'Khatiwala Tank / Sapna Sangeeta', 'Indore Urban', 22.7022, 75.8643],
  ['452005', 'Airport Road / Gandhi Nagar', 'Indore Urban', 22.7380, 75.8115],
  ['452006', 'Manorama Ganj / Gita Bhawan', 'Indore Urban', 22.7165, 75.8821],
  ['452007', 'Chhatribagh / Malharganj', 'Indore Urban', 22.7128, 75.8450],
  ['452008', 'Lokmanya Nagar / Ranjeet Hanuman', 'Indore Urban', 22.7065, 75.8378],
  ['452009', 'Sudama Nagar / Annapurna', 'Indore Urban', 22.6934, 75.8322],
  ['452010', 'Vijay Nagar / Scheme 54', 'Indore Urban', 22.7533, 75.8937],
  ['452011', 'LIG Colony / Malviya Nagar', 'Indore Urban', 22.7385, 75.8912],
  ['452012', 'Rau / Silicon City (AB Road)', 'Indore Urban', 22.6472, 75.8142],
  ['452013', 'Navlakha / Bhanwarkuan Road', 'Indore Urban', 22.6985, 75.8752],
  ['452014', 'Bhawarkua / DAVV Campus', 'Indore Urban', 22.6908, 75.8655],
  ['452015', 'Sanwer Road Industrial Area', 'Indore Urban', 22.7785, 75.8562],
  ['452016', 'Khajrana / Ring Road', 'Indore Urban', 22.7315, 75.9125],
  ['452018', 'Chappan Dukan / New Palasia', 'Indore Urban', 22.7262, 75.8878],
  ['452020', 'Pologround Industrial Estate', 'Indore Urban', 22.7382, 75.8480],
  ['452010', 'Scheme 78 / Brilliant Convention', 'Indore Urban', 22.7662, 75.8970],
  ['452016', 'Scheme 140 / Pipliyahana Lake', 'Indore Urban', 22.7118, 75.9155],
  ['452016', 'Bengali Square / Kanadia Road', 'Indore Urban', 22.7170, 75.9180],
  ['453112', 'Super Corridor IT Hub (TCS/Infosys)', 'Indore Urban', 22.7742, 75.8055],
  ['452010', 'Mahalakshmi Nagar / Bombay Hospital', 'Indore Urban', 22.7601, 75.9032],
  ['452016', 'Phoenix Citadel / Bypass Corridor', 'Indore Urban', 22.7295, 75.9420],
  ['452001', 'Treasure Island Mall / MG Road', 'Indore Urban', 22.7230, 75.8795],
  ['453556', 'IIM Indore / Rau Circle', 'Indore Urban', 22.6285, 75.7950],
  ['452009', 'Footi Kothi / Gopur Square', 'Indore Urban', 22.6912, 75.8235],
  ['452010', 'IDA Scheme 94 / Ring Road', 'Indore Urban', 22.7445, 75.9080],
  ['452002', 'Bada Ganpati / Subhash Marg', 'Indore Urban', 22.7210, 75.8430],
  ['453001', 'Pithampur Road Link Corridor', 'Indore Urban', 22.6320, 75.7480],
]

// Keep all 30 unique areas
const seenArea = new Set<string>()
const BASE = INDORE_PINCODES.filter(p => {
  if (seenArea.has(p[1])) return false
  seenArea.add(p[1])
  return true
})

const OPERATORS = ['MPPKVVCL', 'Tata Power', 'ChargeZone', 'Statiq', 'Jio-bp pulse', 'Ather Grid', 'BPCL-MOB']

export function generatePincodes(): Pincode[] {
  return BASE.map(([code, area, district, lat, lng]) => {
    const isTechArea = /super corridor|it hub|tcs|infosys|vijay nagar|palasia|scheme 54|scheme 78|scheme 140|brilliant/i.test(area)
    const isIndustrial = /industrial|pologround|sanwer|pithampur/i.test(area)
    const population = faker.number.int({ min: isTechArea ? 38000 : 22000, max: isTechArea ? 85000 : 50000 })
    const evAdoptionIndex = isTechArea
      ? faker.number.float({ min: 0.55, max: 0.9, fractionDigits: 2 })
      : isIndustrial
      ? faker.number.float({ min: 0.15, max: 0.35, fractionDigits: 2 })
      : faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 })
    const peakDemandMW = Math.round(population / 1000 * (isTechArea ? 1.6 : 1.1))
    const availableCapacityMW = Math.round(peakDemandMW * faker.number.float({ min: 0.15, max: 0.35, fractionDigits: 2 }))

    return {
      pincode: code,
      area,
      district,
      lat: lat + faker.number.float({ min: -0.002, max: 0.002, fractionDigits: 4 }),
      lng: lng + faker.number.float({ min: -0.002, max: 0.002, fractionDigits: 4 }),
      population,
      evAdoptionIndex,
      peakDemandMW,
      availableCapacityMW,
    }
  })
}

export function generateStations(pincodes: Pincode[]): Station[] {
  const stations: Station[] = []
  const NUM_STATIONS = 40

  for (let i = 0; i < NUM_STATIONS; i++) {
    const idx = faker.number.int({ min: 0, max: pincodes.length - 1 })
    const pin = pincodes[idx]
    const operator = faker.helpers.arrayElement(OPERATORS)
    const categories: Array<{ cat: string; types: string[]; ports: number }> = [
      { cat: 'IT_PARK', types: ['DC_FAST_50KW', 'AC_002'], ports: 6 },
      { cat: 'MALL', types: ['DC_FAST_25KW', 'AC_002'], ports: 4 },
      { cat: 'HIGHWAY_EXIT', types: ['DC_ULTRA_150KW', 'DC_FAST_50KW'], ports: 4 },
      { cat: 'COMMERCIAL', types: ['AC_002', 'AC_001'], ports: 4 },
      { cat: 'RESIDENTIAL', types: ['AC_001'], ports: 2 },
    ]
    const pick = faker.helpers.arrayElement(categories)

    stations.push({
      pincodeIdx: idx,
      name: `${operator} ${pin.area.split(/[,\/]/)[0].trim()}`,
      operator,
      chargerTypes: JSON.stringify(pick.types),
      portCount: pick.ports,
      lat: pin.lat + faker.number.float({ min: -0.006, max: 0.006, fractionDigits: 5 }),
      lng: pin.lng + faker.number.float({ min: -0.006, max: 0.006, fractionDigits: 5 }),
      category: pick.cat,
      dailyUtilization: faker.number.float({ min: 0.12, max: 0.58, fractionDigits: 2 }),
      dailyEnergyKwh: faker.number.float({ min: 80, max: 420, fractionDigits: 1 }),
    })
  }

  return stations
}

export function generateHotspots(pincodes: Pincode[]): Hotspot[] {
  const hotspots: Hotspot[] = []
  const SOURCES = ['mobility_data', 'ev_registrations', 'parking_lot_density', 'commute_pattern']

  // Bias hotspots toward tech/commercial corridors
  const techPincodes = pincodes.filter(p =>
    /super corridor|it hub|tcs|infosys|vijay nagar|palasia|chappan|phoenix|scheme 54|scheme 78|scheme 140|brilliant/i.test(p.area),
  )
  const otherPincodes = pincodes.filter(p => !techPincodes.includes(p))

  for (let i = 0; i < 36; i++) {
    const pin = faker.helpers.arrayElement(techPincodes.length ? techPincodes : pincodes)
    hotspots.push({
      lat: pin.lat + faker.number.float({ min: -0.010, max: 0.010, fractionDigits: 5 }),
      lng: pin.lng + faker.number.float({ min: -0.010, max: 0.010, fractionDigits: 5 }),
      demandScore: faker.number.float({ min: 0.55, max: 0.98, fractionDigits: 2 }),
      source: faker.helpers.arrayElement(SOURCES),
      notes: `High EV commute density near ${pin.area}`,
    })
  }
  for (let i = 0; i < 24; i++) {
    const pin = faker.helpers.arrayElement(otherPincodes.length ? otherPincodes : pincodes)
    hotspots.push({
      lat: pin.lat + faker.number.float({ min: -0.015, max: 0.015, fractionDigits: 5 }),
      lng: pin.lng + faker.number.float({ min: -0.015, max: 0.015, fractionDigits: 5 }),
      demandScore: faker.number.float({ min: 0.2, max: 0.55, fractionDigits: 2 }),
      source: faker.helpers.arrayElement(SOURCES),
      notes: `Emerging demand at ${pin.area}`,
    })
  }

  return hotspots
}
