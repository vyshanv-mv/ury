import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSStore } from '../../store/pos-store';
import { SetupLayout } from '../../components/onboarding/shared/SetupLayout';
import { ONBOARDING_STEPS } from '../../data/steps-data';
import { showToast } from '../../components/ui/toast';
import { useOnboardingStore } from '../../store/onboarding-store';

import Header from '../../components/Header';

const OnboardingFlow: React.FC = () => {
  const { currentStepIndex, setStepIndex, resetStore } = useOnboardingStore();
  const { completeOnboarding } = usePOSStore();
  const navigate = useNavigate();

  const currentStepDef = ONBOARDING_STEPS[currentStepIndex];
  const StepComponent = currentStepDef.component;

  // Sync with main POS store when done
  const handleFinalComplete = useCallback(async () => {
    await completeOnboarding();
    resetStore();
    showToast.success("Setup completed successfully!");
    navigate('/admin');
  }, [completeOnboarding, navigate, resetStore]);

  const handleNext = useCallback((data?: any) => {
    // If Quick Setup was chosen and successful, jump to success
    if (data?.mode === 'quick') {
      const successStepIndex = ONBOARDING_STEPS.findIndex(s => s.id === 'success');
      if (successStepIndex !== -1) {
        setStepIndex(successStepIndex);
        return;
      }
    }

    if (currentStepIndex >= ONBOARDING_STEPS.length - 1) {
      handleFinalComplete();
      return;
    }
    setStepIndex(currentStepIndex + 1);
  }, [currentStepIndex, handleFinalComplete, setStepIndex]);

  const handleBack = useCallback(() => {
    if (currentStepIndex <= 0) return;
    setStepIndex(currentStepIndex - 1);
  }, [currentStepIndex, setStepIndex]);

  // Prevent accidental exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStepDef.id !== 'welcome' && currentStepDef.id !== 'success') {
        e.preventDefault();
        e.returnValue = "Setup is not complete. Your progress will be saved.";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStepDef.id]);

  const stepProps = {
    onNext: handleNext,
    onBack: handleBack,
    data: {} // Satisfy interface
  };

  const showHeader = currentStepDef.id !== 'welcome' && currentStepDef.id !== 'success';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showHeader && <Header hideSearch hideUserMenu />}
      
      <div className="flex-1 overflow-y-auto flex flex-col">
        {currentStepDef.id === 'welcome' || currentStepDef.id === 'success' || currentStepDef.id === 'configuration' || currentStepDef.id === 'loading' || currentStepDef.id === 'mode' ? (
          <StepComponent {...stepProps} key={currentStepDef.id} />
        ) : (
          <SetupLayout>
            <StepComponent {...stepProps} key={currentStepDef.id} />
          </SetupLayout>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
