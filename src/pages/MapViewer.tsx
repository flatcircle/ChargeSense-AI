// @ts-nocheck
import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { MOCK_DB } from '../data/mock-db'
import { MapPin, Plug, Zap, Info } from 'lucide-react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon paths safely in ESM/bundler environments
try {
  if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }
} catch (e) {
  console.warn('Leaflet default icon paths override failed:', e);
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-icon-div',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}bf;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  })
}

const colors = {
  station: '#a855f7', // purple-500
  proposal: '#10b981', // brand (emerald)
  hotspot: '#f59e0b', // amber-500
}

export default function MapViewer() {
  const { stations, proposals, hotspots } = MOCK_DB
  const [layers, setLayers] = useState({
    stations: true,
    proposals: true,
    hotspots: false,
    coverage: true,
  })

  // Center map on Indore
  const center: [number, number] = [22.7196, 75.8577]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Spatial Infrastructure Map</h1>
          <p className="text-slate-400 text-sm">Visualize demand hotspots, existing chargers, and AI-proposed locations.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 p-3 bg-dark-800 rounded-xl border border-dark-600/50 w-fit">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input 
              type="checkbox" checked={layers.proposals} 
              onChange={e => setLayers(l => ({...l, proposals: e.target.checked}))} 
              className="accent-brand" 
            />
            <Zap size={14} className="text-brand" /> Proposals
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input 
              type="checkbox" checked={layers.stations} 
              onChange={e => setLayers(l => ({...l, stations: e.target.checked}))} 
              className="accent-purple-400" 
            />
            <Plug size={14} className="text-purple-400" /> Existing
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input 
              type="checkbox" checked={layers.hotspots} 
              onChange={e => setLayers(l => ({...l, hotspots: e.target.checked}))} 
              className="accent-amber-400" 
            />
            <MapPin size={14} className="text-amber-400" /> Hotspots
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input 
              type="checkbox" checked={layers.coverage} 
              onChange={e => setLayers(l => ({...l, coverage: e.target.checked}))} 
              className="accent-blue-400" 
            />
            <Info size={14} className="text-blue-400" /> 1km Coverage
          </label>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-dark-600/50 shadow-2xl relative z-10 min-h-[450px]">
        <MapContainer 
          key={`leaflet-map-proposals-${proposals.length}`}
          center={center} 
          zoom={11} 
          className="w-full h-full" 
          style={{ height: '100%', minHeight: '500px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {layers.stations && stations.map(s => (
            <Marker key={`s-${s.id}`} position={[s.lat, s.lng]} icon={createCustomIcon(colors.station)}>
              <Popup className="dark-popup">
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-purple-400 mb-1 text-xs">{s.name}</h3>
                  <p className="text-[10px] text-gray-300">Operator: <span className="font-semibold text-white">{s.operator}</span></p>
                  <p className="text-[10px] text-gray-300">Ports: <span className="font-semibold text-white">{s.portCount}</span></p>
                  <p className="text-[10px] text-gray-300">Util: <span className="font-semibold text-brand">{(s.dailyUtilization * 100).toFixed(0)}%</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {layers.proposals && proposals.map(p => (
            <Marker key={`p-${p.id}`} position={[p.proposedLat, p.proposedLng]} icon={createCustomIcon(colors.proposal)}>
              <Popup className="dark-popup">
                <div className="p-1 min-w-[165px]">
                  <h3 className="font-bold text-brand mb-1 text-xs">{p.pincode.area}</h3>
                  <p className="text-[10px] text-gray-300">Site Score: <span className="font-semibold text-white">{(p.siteScore*100).toFixed(0)}%</span></p>
                  <p className="text-[10px] text-gray-300">Payback: <span className="font-semibold text-white">{p.paybackMonths} Months</span></p>
                  <p className="text-[10px] text-gray-300 font-semibold text-brand-light mt-1">Est. Revenue: ₹{p.estimatedRevenueInrPerMonth.toLocaleString()}/mo</p>
                </div>
              </Popup>
              {layers.coverage && (
                <Circle 
                  center={[p.proposedLat, p.proposedLng]} 
                  radius={1000} // 1km coverage 
                  pathOptions={{ color: colors.proposal, fillColor: colors.proposal, fillOpacity: 0.08, weight: 1.5 }} 
                />
              )}
            </Marker>
          ))}

          {layers.hotspots && hotspots.map(h => (
            <Circle 
              key={`h-${h.id}`} 
              center={[h.lat, h.lng]} 
              radius={h.demandScore * 400} 
              pathOptions={{ color: colors.hotspot, fillColor: colors.hotspot, fillOpacity: 0.2, weight: 0 }}
            >
              <Popup className="dark-popup">
                <div className="p-1 min-w-[120px]">
                  <p className="text-[10px] text-white font-medium">{h.notes}</p>
                  <p className="text-[9px] text-amber-400 mt-1 font-bold">Demand Score: {h.demandScore.toFixed(2)}</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
