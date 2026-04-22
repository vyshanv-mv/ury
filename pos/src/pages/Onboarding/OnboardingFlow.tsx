import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../index.css';
import { SetupLayout } from '../../components/onboarding/SetupLayout';

import { OrganizationSetup } from '../../components/onboarding/OrganizationSetup';
import { MenuSetup } from '../../components/onboarding/MenuSetup';
import { SettingsConfiguration } from '../../components/onboarding/SettingsConfiguration';
import { usePOSStore } from '../../store/pos-store';
import { toast } from 'react-toastify';

const STEPS = {
  ORGANIZATION: 0,
  MENU: 1,
  SETTINGS: 2,
};

const TOTAL_STEPS = Object.keys(STEPS).length;

const PAGE_INFO: Record<number, { title: string; subtitle: string; footer: string }> = {
  [STEPS.ORGANIZATION]: { 
    title: 'Welcome to URY', 
    subtitle: '',
    footer: "This information will be used for your invoices and reports"
  },
  [STEPS.MENU]: { 
    title: '', 
    subtitle: '',
    footer: "You can add more items and categories later in the menu builder"
  },
  [STEPS.SETTINGS]: { 
    title: 'Final Configuration', 
    subtitle: 'Tailor the system to your specific needs',
    footer: "Almost there! These final settings complete your profile"
  },
};

const STORAGE_KEY = "ury_onboarding_state";

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentStep === 'number' && parsed.currentStep >= 0 && parsed.currentStep < TOTAL_STEPS) {
          return parsed.currentStep;
        }
      }
    } catch (e) {
      console.error('Failed to restore onboarding state:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
    return STEPS.ORGANIZATION;
  });

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && typeof parsed.formData === 'object') {
          return parsed.formData;
        }
      }
    } catch {
      // Error handled above
    }
    return {};
  });

  const [isFinishing, setIsFinishing] = useState(false);
  const navigate = useNavigate();

  // Persist state on change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, formData }));
      } catch (e) {
        console.warn('Failed to save onboarding state:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentStep, formData]);


  const next = useCallback((data?: Record<string, any>) => {
    if (data) setFormData((prev: Record<string, any>) => ({ ...prev, ...data }));
    setCurrentStep((prev: number) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 0));
  }, []);

  /**
   * "Finish Setup" handler on the final Settings step.
   *
   * Organization and Menu have already been persisted via their respective
   * APIs. This step marks onboarding as complete and transitions to POS.
   */
  const handleFinish = useCallback(async () => {
    if (isFinishing) return;

    try {
      setIsFinishing(true);

      // Mark onboarding complete using the new action
      localStorage.setItem('ury_setup_completed', 'true');
      usePOSStore.getState().setNeedsOnboarding(false);

      // Re-initialize the app so POS profile, menu, etc. are loaded fresh.
      try {
        await usePOSStore.getState().initializeApp();
      } catch (error) {
        console.warn('Post-onboarding initialization encountered an issue:', error);
      }

      toast.success('Setup completed successfully!');
      // Clear persistence after successful setup
      localStorage.removeItem(STORAGE_KEY);
      // Basename is /pos, so navigate('/') goes to /pos/
      navigate('/', { replace: true });
    } catch (error: any) {
      // Restore onboarding state if something truly unexpected happens
      usePOSStore.setState({ needsOnboarding: true });
      toast.error(error.message || 'Failed to complete setup');
    } finally {
      setIsFinishing(false);
    }
  }, [isFinishing, navigate]);



  const renderContent = () => {
    switch (currentStep) {
      case STEPS.ORGANIZATION:
        return <OrganizationSetup onNext={next} />;
      case STEPS.MENU:
        return (
          <MenuSetup
            onNext={next}
            onBack={back}
          />
        );
      case STEPS.SETTINGS:
        return (
          <SettingsConfiguration
            onFinish={handleFinish}
            onBack={back}
            disabled={isFinishing}
          />
        );
      default:
        return null;
    }
  };

  const stepInfo = PAGE_INFO[currentStep] ?? PAGE_INFO[STEPS.ORGANIZATION];

  return (
    <SetupLayout
      title={stepInfo.title}
      subtitle={stepInfo.subtitle}
      footerText={stepInfo.footer}
      hideHeader={false}
      activeStep={currentStep}
    >
      <div className="animate-in fade-in zoom-in-95 duration-500 ease-out">
        {renderContent()}
      </div>
    </SetupLayout>
  );
}
