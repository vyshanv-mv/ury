import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  DoorOpen,
  Table2,
  Utensils,
  CreditCard,
  Users,
  Printer,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../../../store/onboarding-store';
import { showToast } from '../../ui/toast';
import { cn } from '../../../lib/utils';
import type { OnboardingStepProps } from '../../../data/steps-data';

// Sub-step components
import { BranchStep } from './configuration/BranchStep';
import { RestaurantStep } from './configuration/RestaurantStep';
import { RoomsStep } from './configuration/RoomsStep';
import { TablesStep } from './configuration/TablesStep';
import { MenuStep } from './configuration/MenuStep';
import { PaymentStep } from './configuration/PaymentStep';
import { UsersStep } from './configuration/UsersStep';
import { PrinterStep } from './configuration/PrinterStep';

const CONFIG_STEPS = [
  { id: 'branch', title: 'Branch Setup', icon: MapPin, desc: 'Set up your branch location details' },
  { id: 'restaurant', title: 'Restaurant Profile', icon: Building2, desc: 'Branding, cuisine type and hours' },
  { id: 'printer', title: 'Printer Setup', icon: Printer, desc: 'Configure billing and kitchen printers' },
  { id: 'rooms', title: 'URY Rooms', icon: DoorOpen, desc: 'Define your dining areas' },
  { id: 'tables', title: 'URY Tables', icon: Table2, desc: 'Configure table numbers and seats' },
  { id: 'menu', title: 'URY Menu', icon: Utensils, desc: 'Set up your catalog and taxes' },
  { id: 'payments', title: 'Mode of Payment', icon: CreditCard, desc: 'Supported payment gateways' },
  { id: 'users', title: 'Team Setup', icon: Users, desc: 'Create cashier and admin accounts' },
];

export const ConfigurationStep: React.FC<OnboardingStepProps> = ({ onNext, onBack }) => {
  const { completedSteps, skippedSteps, markStepComplete, markStepSkipped } = useOnboardingStore();

  // Local state — completely independent from the outer OnboardingFlow index
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentStep = CONFIG_STEPS[subStepIndex];
  const isLastStep = subStepIndex === CONFIG_STEPS.length - 1;

  const progressPercent = Math.round(((completedSteps.length + skippedSteps.length) / CONFIG_STEPS.length) * 100);


  const handleNext = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      markStepComplete(currentStep.id);
      if (isLastStep) {
        onNext();
      } else {
        setSubStepIndex(subStepIndex + 1);
      }
    } catch (error: any) {
      showToast.error(error.message || 'Failed to save step');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log(`[API] Skip step: ${currentStep.id}`, { skipped: true });
    markStepSkipped(currentStep.id);
    if (isLastStep) {
      onNext();
    } else {
      setSubStepIndex(subStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (subStepIndex === 0) {
      onBack();
    } else {
      setSubStepIndex(subStepIndex - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'branch': return <BranchStep />;
      case 'restaurant': return <RestaurantStep />;
      case 'rooms': return <RoomsStep />;
      case 'tables': return <TablesStep />;
      case 'menu': return <MenuStep />;
      case 'printer': return <PrinterStep />;
      case 'payments': return <PaymentStep />;
      case 'users': return <UsersStep />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 text-gray-900 overflow-hidden font-inter">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-30">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="flex items-center mt-6 mb-2 h-10 px-6">
            <img src="/assets/ury/pos/ury_pos.png" alt="URY POS" className="h-8 w-auto object-contain" />
          </div>

          <nav className="flex-1 p-6 overflow-y-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-1">
                Steps
              </h2>

              <div className="space-y-1">
                {CONFIG_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = subStepIndex === i;
                  const isCompleted = completedSteps.includes(step.id);
                  const isSkipped = skippedSteps.includes(step.id);
                  const isAccessible = i <= subStepIndex || isCompleted || isSkipped;

                  return (
                    <Button
                      key={step.id}
                      variant="ghost"
                      disabled={!isAccessible}
                      onClick={() => setSubStepIndex(i)}
                      className={cn(
                        'w-full flex items-center justify-start px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                        isActive
                          ? 'bg-white text-gray-900 shadow-sm font-semibold'
                          : isAccessible
                            ? 'text-gray-700 hover:bg-white/60 hover:text-gray-900'
                            : 'text-gray-400/50 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e-full" />
                      )}

                      <div className="flex items-center gap-3 ms-1 w-full overflow-hidden">
                        <div className="flex-shrink-0">
                          {isCompleted && !isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : isSkipped && !isActive ? (
                            <SkipForward className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-gray-900" : "text-gray-500")} />
                          )}
                        </div>
                        <div className="flex flex-col items-start overflow-hidden w-full text-start">
                          <span className="truncate w-full">{step.title}</span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Progress bar — bottom of sidebar */}
          <div className="px-6 pb-6 pt-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Progress
                </span>
                <span className="text-xs font-semibold text-gray-900">
                  {completedSteps.length}/{CONFIG_STEPS.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden mx-1 w-auto">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Step Header */}
          <div className="px-10 py-8 border-b border-gray-200 bg-white/50 backdrop-blur-md">
            <div className="max-w-5xl w-full mx-auto">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{currentStep.title}</h2>
                {completedSteps.includes(currentStep.id) && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm font-medium opacity-80">{currentStep.desc}</p>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="max-w-5xl w-full mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="px-10 py-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
            <div className="max-w-5xl w-full mx-auto flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="gap-2 font-bold"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                {/* Skip — primary outlined */}
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={loading}
                  size="lg"
                  className="gap-2 font-bold"
                >
                  <SkipForward className="w-5 h-5" />
                  Skip
                </Button>

                {/* Save & Continue */}
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  size="lg"
                  className="gap-2 min-w-[200px] font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLastStep ? 'Complete Setup' : 'Save & Continue'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
