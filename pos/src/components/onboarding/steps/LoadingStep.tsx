import React, { useEffect, useState } from 'react';
import { ProgressLoader } from '../shared/ProgressLoader';
import type { OnboardingStepProps } from '../../../data/steps-data';
type StepStatus = 'pending' | 'loading' | 'completed';

interface LoaderStep {
  id: string;
  label: string;
  status: StepStatus;
}

/** Max duration: ~3 seconds (60 ticks × 50ms) */
const TICK_INTERVAL = 50;
const TICKS_TO_COMPLETE = 60;

export const LoadingStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<LoaderStep[]>([
    { id: '1', label: 'Initializing company structure', status: 'loading' },
    { id: '2', label: 'Setting up chart of accounts', status: 'pending' },
    { id: '3', label: 'Configuring restaurant modules', status: 'pending' },
    { id: '4', label: 'Creating default settings', status: 'pending' },
    { id: '5', label: 'Finalizing your workspace', status: 'pending' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / TICKS_TO_COMPLETE);
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onNext(data), 600);
          return 100;
        }
        return next;
      });
    }, TICK_INTERVAL);

    return () => clearInterval(timer);
  }, [onNext, data]);

  useEffect(() => {
    setSteps(prev => prev.map((step, idx) => {
      const stepThreshold = (idx + 1) * 20;
      const prevThreshold = idx * 20;

      if (progress >= stepThreshold) {
        return { ...step, status: 'completed' as StepStatus };
      } else if (progress > prevThreshold) {
        return { ...step, status: 'loading' as StepStatus };
      }
      return step;
    }));
  }, [progress]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-inter">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl bg-white rounded-2xl p-12 md:p-16 shadow-2xl shadow-blue-100/50 border border-gray-100 text-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50" />

          <div className="relative z-10 mb-12">
            <h2 className="text-xl font-medium text-gray-900 mb-4 tracking-tight">
              Setting up your workspace
            </h2>
            <p className="text-gray-500 font-medium text-sm opacity-60">
              This will only take a moment. Please don't close this window.
            </p>
          </div>

          <div className="relative z-10">
            <ProgressLoader progress={progress} steps={steps} />
          </div>
        </div>
      </div>
    </div>
  );
};
