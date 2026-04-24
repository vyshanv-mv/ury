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
import Header from '../../Header';

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
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden font-inter">
      {/* Global POS Header */}
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-30 shadow-sm">
          <div className="flex flex-col h-full overflow-hidden">
            <nav className="flex-1 p-6 overflow-y-auto">
              <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                  Configuration Progress
                </h2>

                <div className="space-y-1.5">
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
                          'w-full flex items-center justify-start px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative rounded-lg h-auto',
                          isActive
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                            : isAccessible
                              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                        )}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="active-indicator"
                            className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e-full" 
                          />
                        )}

                        <div className="flex items-center gap-3 w-full overflow-hidden">
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            isActive ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isSkipped ? (
                              <SkipForward className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Icon className="w-4 h-4 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex flex-col items-start overflow-hidden w-full text-start">
                            <span className={cn(
                              "truncate w-full font-bold",
                              isActive ? "text-gray-900" : "text-gray-500"
                            )}>
                              {step.title}
                            </span>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Overall Progress */}
            <div className="px-6 pb-6 pt-2">
              <div className="bg-blue-600 rounded-xl p-5 shadow-lg shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                    Overall Completion
                  </span>
                  <span className="text-xs font-bold text-white">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden relative z-10">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium text-blue-100/80 leading-relaxed relative z-10">
                  {completedSteps.length} of {CONFIG_STEPS.length} steps verified and ready for production.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
          {/* Step Header */}
          <div className="px-12 py-10 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="max-w-5xl w-full mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      {React.createElement(currentStep.icon, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{currentStep.title}</h2>
                      <p className="text-gray-500 text-sm font-bold opacity-70 mt-0.5">{currentStep.desc}</p>
                    </div>
                  </div>
                </div>
                {completedSteps.includes(currentStep.id) && (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-50">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-5xl w-full mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="px-12 py-8 border-t border-gray-200 bg-white/90 backdrop-blur-md sticky bottom-0 z-20">
            <div className="max-w-5xl w-full mx-auto flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="gap-3 font-black text-xs uppercase tracking-widest hover:bg-gray-100 px-6 h-12"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous Step
              </Button>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={loading}
                  className="gap-3 font-black text-xs uppercase tracking-widest px-8 h-12 border-2 hover:bg-gray-50"
                >
                  <SkipForward className="w-5 h-5" />
                  Skip Step
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="gap-3 min-w-[240px] font-black text-xs uppercase tracking-widest h-12 shadow-lg shadow-blue-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Progress...
                    </>
                  ) : (
                    <>
                      {isLastStep ? 'Complete All Configuration' : 'Save & Continue'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
