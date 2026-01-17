import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';

interface WelcomeTourProps {
  userName?: string;
}

export function WelcomeTour({ userName }: WelcomeTourProps) {
  const { showWelcome, dismissWelcome, startTour, completeOnboarding } = useOnboarding();

  const handleStartTour = () => {
    dismissWelcome();
    // Small delay to let the modal close
    setTimeout(() => {
      startTour('dashboard');
    }, 300);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Gradient header */}
            <div className="gradient-bg p-8 pb-12">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold text-white"
              >
                ¡Bienvenido{userName ? `, ${userName}` : ''}! 🎉
              </motion.h1>
            </div>

            {/* Content */}
            <div className="p-6 -mt-6 bg-card rounded-t-3xl relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <p className="text-muted-foreground">
                  Tu cuenta ha sido creada exitosamente. Te guiaremos por las funciones principales para que puedas sacar el máximo provecho del sistema.
                </p>

                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Lo que aprenderás:
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Navegación por el sistema
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Cómo agendar citas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Gestión de servicios y productos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Control de turnos y ventas
                    </li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex flex-col sm:flex-row gap-3"
              >
                <Button
                  onClick={handleStartTour}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  Comenzar tour
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="lg"
                >
                  Saltar por ahora
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-xs text-center text-muted-foreground"
              >
                Puedes volver a ver este tour desde el botón de ayuda (?) en cada página
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
