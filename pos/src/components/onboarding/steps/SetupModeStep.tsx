import React, { useState } from 'react';
import { Zap, Settings, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { onboardsetupApi } from '../../../lib/onboardsetup-api';
import { showToast } from '../../ui/toast';
import type { OnboardingStepProps } from '../../../data/steps-data';

export const SetupModeStep: React.FC<OnboardingStepProps> = ({ onNext }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'quick' | 'manual'>('quick');

  const handleContinue = async () => {
    if (selectedMode === 'manual') {
      onNext(); // Proceed to OrganizationStep
      return;
    }

    // Quick Setup Flow
    setLoading(true);
    try {
      await onboardsetupApi.setupUryDemo();
      
      // Verify setup status after success
      const { needsOnboarding } = await onboardsetupApi.checkSetupStatus();
      if (!needsOnboarding) {
        showToast.success("Workspace configured successfully with demo data!");
        // We go to a special loading/success state or just finish
        onNext({ mode: 'quick' }); 
      } else {
        throw new Error("Setup complete flag was not set. Please try again.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to finalize setup.";
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose your setup mode</h2>
        <p className="text-gray-500 text-lg">Select how you want to configure your restaurant workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Quick Setup */}
        <div 
          onClick={() => !loading && setSelectedMode('quick')}
          className={cn(
            "relative group cursor-pointer p-8 rounded-[2rem] border-2 transition-all duration-300 bg-white",
            selectedMode === 'quick' 
              ? "border-blue-600 shadow-xl shadow-blue-50" 
              : "border-gray-100 hover:border-gray-200"
          )}
        >
          {selectedMode === 'quick' && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Recommended
            </div>
          )}
          
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
            selectedMode === 'quick' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
          )}>
            <Zap fill={selectedMode === 'quick' ? "currentColor" : "none"} size={28} />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Setup</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Instantly populate your workspace with demo data, menus, and layouts. Perfect for exploring URY.
          </p>

          <ul className="space-y-3">
            {[
              "Automated demo company",
              "Sample menu & courses",
              "Pre-configured tables & rooms",
              "Ready to take orders now"
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={16} className={cn(selectedMode === 'quick' ? "text-blue-600" : "text-gray-300")} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Manual Setup */}
        <div 
          onClick={() => !loading && setSelectedMode('manual')}
          className={cn(
            "relative group cursor-pointer p-8 rounded-[2rem] border-2 transition-all duration-300 bg-white",
            selectedMode === 'manual' 
              ? "border-blue-600 shadow-xl shadow-blue-50" 
              : "border-gray-100 hover:border-gray-200"
          )}
        >
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
            selectedMode === 'manual' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
          )}>
            <Settings size={28} />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Setup</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Configure every detail of your organization, menu, and hardware from scratch.
          </p>

          <ul className="space-y-3">
            {[
              "Custom company profile",
              "Build your own menu",
              "Define custom floor plans",
              "Full module control"
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={16} className={cn(selectedMode === 'manual' ? "text-blue-600" : "text-gray-300")} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleContinue}
          disabled={loading}
          size="lg" 
          className="px-12 h-14 rounded-xl text-lg font-bold gap-3 shadow-lg shadow-blue-100 min-w-[240px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
