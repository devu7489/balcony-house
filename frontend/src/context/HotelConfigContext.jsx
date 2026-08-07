import { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'

// Sensible fallback while /api/config is loading (or if it ever fails) so pages never
// have to null-check every field - same shape the backend's ConfigDto returns.
const defaultConfig = {
  hotelName: 'The Balcony House',
  tagline: 'Stay a little longer.',
  logoUrl: '',
  heroImageUrl: '/images/hero/balcony-sunrise.png',
  contactEmail: '',
  contactPhone: '',
  address: '',
  childcareEnabled: true,
  fullBoardEnabled: true,
}

const HotelConfigContext = createContext(null)

export function HotelConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/config')
      .then(({ data }) => setConfig({ ...defaultConfig, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.title = config.hotelName
  }, [config.hotelName])

  return (
    <HotelConfigContext.Provider value={{ ...config, loading }}>
      {children}
    </HotelConfigContext.Provider>
  )
}

export function useHotelConfig() {
  const ctx = useContext(HotelConfigContext)
  if (!ctx) throw new Error('useHotelConfig must be used within HotelConfigProvider')
  return ctx
}
