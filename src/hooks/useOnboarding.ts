import { useState, useEffect, useCallback } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const ONBOARDING_COMPLETED_KEY = 'salon_onboarding_completed';
const TOUR_SEEN_KEY = 'salon_tours_seen';

interface TourConfig {
  id: string;
  steps: DriveStep[];
}

// Tour configurations for each module
export const tourConfigs: Record<string, TourConfig> = {
  dashboard: {
    id: 'dashboard',
    steps: [
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: '📍 Menú de navegación',
          description: 'Aquí encontrarás todos los módulos del sistema. Haz clic en cada uno para acceder.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="branch-selector"]',
        popover: {
          title: '🏪 Selector de sucursal',
          description: 'Si tienes varias sucursales, selecciona aquí en cuál deseas trabajar.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="quick-actions"]',
        popover: {
          title: '⚡ Acciones rápidas',
          description: 'Accede rápidamente a las funciones más usadas: nueva cita, nueva venta, etc.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="stats-cards"]',
        popover: {
          title: '📊 Estadísticas del día',
          description: 'Aquí verás un resumen de ventas, citas completadas y pendientes del día.',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  },
  agenda: {
    id: 'agenda',
    steps: [
      {
        element: '[data-tour="calendar"]',
        popover: {
          title: '📅 Tu calendario',
          description: 'Este es tu calendario de citas. Haz clic en cualquier hora para crear una nueva cita.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '[data-tour="new-appointment"]',
        popover: {
          title: '➕ Nueva cita',
          description: 'Usa este botón para agendar una cita rápidamente.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },
  servicios: {
    id: 'servicios',
    steps: [
      {
        element: '[data-tour="services-list"]',
        popover: {
          title: '💇 Lista de servicios',
          description: 'Aquí puedes ver y gestionar todos los servicios que ofreces: cortes, tratamientos, etc.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="add-service"]',
        popover: {
          title: '➕ Agregar servicio',
          description: 'Haz clic aquí para agregar un nuevo servicio con su precio y duración.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },
  turnos: {
    id: 'turnos',
    steps: [
      {
        element: '[data-tour="open-shift"]',
        popover: {
          title: '🔓 Abrir turno',
          description: 'Antes de registrar ventas, debes abrir un turno. Esto te permite llevar control del efectivo.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="shifts-list"]',
        popover: {
          title: '📋 Historial de turnos',
          description: 'Aquí verás todos los turnos abiertos y cerrados con su información.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },
  ventas: {
    id: 'ventas',
    steps: [
      {
        element: '[data-tour="new-sale"]',
        popover: {
          title: '💰 Nueva venta',
          description: 'Registra una nueva venta de servicios o productos.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="sales-list"]',
        popover: {
          title: '📋 Historial de ventas',
          description: 'Aquí verás todas las ventas realizadas con detalles de pago.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },
};

export function useOnboarding() {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [toursSeen, setToursSeen] = useState<string[]>([]);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    
    if (!completed) {
      setIsFirstTime(true);
      setShowWelcome(true);
    }
    
    if (seen) {
      try {
        setToursSeen(JSON.parse(seen));
      } catch {
        setToursSeen([]);
      }
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsFirstTime(false);
    setShowWelcome(false);
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    completeOnboarding();
  }, [completeOnboarding]);

  const markTourSeen = useCallback((tourId: string) => {
    setToursSeen(prev => {
      const updated = [...prev, tourId];
      localStorage.setItem(TOUR_SEEN_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const startTour = useCallback((moduleId: string) => {
    const config = tourConfigs[moduleId];
    if (!config) return;

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendido',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'salon-tour-popover',
      steps: config.steps,
      onDestroyed: () => {
        markTourSeen(moduleId);
      },
    });

    driverObj.drive();
  }, [markTourSeen]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem(TOUR_SEEN_KEY);
    setIsFirstTime(true);
    setShowWelcome(true);
    setToursSeen([]);
  }, []);

  const hasSeenTour = useCallback((tourId: string) => {
    return toursSeen.includes(tourId);
  }, [toursSeen]);

  return {
    isFirstTime,
    showWelcome,
    toursSeen,
    completeOnboarding,
    dismissWelcome,
    startTour,
    resetOnboarding,
    hasSeenTour,
    markTourSeen,
  };
}
