'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handleRegister = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('💚 [PWA] Service Worker registrado con éxito con scope:', registration.scope)
      } catch (error) {
        console.error('💚 [PWA] Error al registrar el Service Worker:', error)
      }
    }

    // Register SW after page has fully loaded to ensure fast initial page load
    if (document.readyState === 'complete') {
      handleRegister()
    } else {
      window.addEventListener('load', handleRegister)
    }

    return () => {
      window.removeEventListener('load', handleRegister)
    }
  }, [])

  return null
}
