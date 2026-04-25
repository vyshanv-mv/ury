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
import { onboardsetupApi } from '../../../lib/onboardsetup-api';
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
  { id: 'rooms', title: 'Dining Areas', icon: DoorOpen, desc: 'Define your dining areas' },
  { id: 'tables', title: 'Table Layout', icon: Table2, desc: 'Configure table numbers and seats' },
  { id: 'menu', title: 'Menu Items', icon: Utensils, desc: 'Set up your catalog and taxes' },
  { id: 'payments', title: 'Payment Modes', icon: CreditCard, desc: 'Supported payment methods' },
  { id: 'users', title: 'Team Members', icon: Users, desc: 'Create cashier and admin accounts' },
];

export const ConfigurationStep: React.FC<OnboardingStepProps> = ({ onNext, onBack }) => {
  const { completedSteps, skippedSteps, markStepComplete, markStepSkipped } = useOnboardingStore();

  const [subStepIndex, setSubStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentStep = CONFIG_STEPS[subStepIndex];
  const isLastStep = subStepIndex === CONFIG_STEPS.length - 1;

  const progressPercent = Math.round(((completedSteps.length + skippedSteps.length) / CONFIG_STEPS.length) * 100);

  const handleNext = async () => {
    setLoading(true);
    try {
      const state = useOnboardingStore.getState();
      
      switch (currentStep.id) {
        case 'branch':
          if (state.branch && state.branch.length > 0) {
            for (const b of state.branch) {
              await onboardsetupApi.setupBranch(b);
            }
          }
          break;
        case 'restaurant':
          if (state.restaurant && state.restaurant.length > 0) {
            await onboardsetupApi.setupRestaurant(state.restaurant[0]);
          }
          break;
        case 'rooms':
          if (state.rooms && state.rooms.length > 0) {
            await onboardsetupApi.setupRoom(state.rooms);
          }
          break;
        case 'tables':
          if (state.tables && state.tables.length > 0) {
            await onboardsetupApi.setupTable({ tables: state.tables });
          }
          break;
        case 'menu':
          if (state.menu.items && state.menu.items.length > 0) {
            await onboardsetupApi.setupMenu({
              items: state.menu.items,
              tax_calculation: state.menu.tax_calculation as 'Inclusive' | 'Exclusive',
              company_name: state.organization.company_name || ''
            });
          }
          break;
        case 'printer':
          if (state.printer && state.printer.length > 0) {
            await onboardsetupApi.setupPrinter(state.printer[0]);
          }
          break;
        case 'payments':
          if (state.payments && state.payments.length > 0) {
            await onboardsetupApi.setupMop({ payments: state.payments });
          }
          break;
        case 'users':
          if (state.users && state.users.length > 0) {
            await onboardsetupApi.setupUserManagement({ users: state.users });
          }
          break;
      }

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
    <div className="flex-1 flex bg-gray-50/50 text-gray-900 overflow-hidden font-inter">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-white border-r border-gray-100 flex-shrink-0 flex flex-col z-30 shadow-sm">
          <div className="flex flex-col h-full overflow-hidden">
            <nav className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3">
                <h2 className="text-xs font-bold text-gray-400 mb-4 px-3">
                  Setup Journey
                </h2>

                <div className="space-y-1">
                  {CONFIG_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = subStepIndex === i;
                    const isCompleted = completedSteps.includes(step.id);
                    const isSkipped = skippedSteps.includes(step.id);
                    const isAccessible = i <= subStepIndex || isCompleted || isSkipped;

                    return (
                      <button
                        key={step.id}
                        disabled={!isAccessible}
                        onClick={() => setSubStepIndex(i)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 group relative rounded-xl h-auto',
                          isActive
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200 font-bold'
                            : isAccessible
                              ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-semibold'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                        )}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="setup-nav-indicator"
                            className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e-full" 
                          />
                        )}
                        
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          isActive 
                            ? "bg-blue-600 text-white" 
                            : isCompleted 
                              ? "bg-emerald-50 text-emerald-600"
                              : isSkipped
                                ? "bg-amber-50 text-amber-600"
                                : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isSkipped ? (
                            <SkipForward className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex flex-col items-start overflow-hidden text-start">
                          <span className={cn(
                            "truncate w-full text-xs",
                            isActive ? "text-blue-600" : "text-gray-700"
                          )}>
                            {step.title}
                          </span>
                          <span className={cn(
                            "text-[10px] truncate w-full font-medium",
                            isActive ? "text-blue-400/80" : "text-gray-400"
                          )}>
                            {step.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Overall Progress */}
            <div className="p-6 border-t border-gray-50">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-500">
                    Completion
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-5xl w-full mx-auto pb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="px-12 py-6 border-t border-gray-100 bg-white z-20 shadow-[0_-4px_20px_0_rgba(0,0,0,0.02)]">
            <div className="max-w-5xl w-full mx-auto flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="gap-2 font-bold text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-6 h-12 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={loading}
                  className="gap-2 font-bold text-sm px-8 h-12 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300"
                >
                  Skip Step
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="gap-2 min-w-[200px] font-bold text-sm h-12 rounded-xl shadow-lg shadow-blue-100 bg-blue-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {isLastStep ? 'Finish Configuration' : 'Next Step'}
                      <ArrowRight className="w-4 h-4" />
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
