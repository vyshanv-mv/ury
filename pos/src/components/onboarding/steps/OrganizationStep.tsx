import React, { useState, useEffect } from 'react';
import {
  Zap, Building2, Tag, Loader2,
  User, Mail, CheckCircle2, Sliders, ArrowLeft, ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { StepIndicator } from '../shared/StepIndicator';
import { showToast } from '../../ui/toast';
import { useOnboardingStore } from '../../../store/onboarding-store';
import { onboardsetupApi } from '../../../lib/onboardsetup-api';
import { Input } from '../../ui/input';
import { Select, SelectItem } from '../../ui/select';
import { Button } from '../../ui/button';
import { motion } from 'framer-motion';

type CountryKey =
  | "India" | "United States" | "United Kingdom" | "Canada"
  | "Australia" | "UAE" | "Singapore" | "Germany" | "France";

const countryDefaults: Record<CountryKey, { label: string; taxLabel: string; currency: string; timezone: string }> = {
  India: { label: "🇮🇳 India", taxLabel: "GSTIN", currency: "INR", timezone: "Asia/Kolkata (IST +5:30)" },
  "United States": { label: "🇺🇸 United States", taxLabel: "EIN", currency: "USD", timezone: "America/New_York (EST -5:00)" },
  "United Kingdom": { label: "🇬🇧 United Kingdom", taxLabel: "VAT Number", currency: "GBP", timezone: "Europe/London (GMT +0:00)" },
  Canada: { label: "🇨🇦 Canada", taxLabel: "Business Number", currency: "CAD", timezone: "America/Toronto (EST -5:00)" },
  Australia: { label: "🇦🇺 Australia", taxLabel: "ABN", currency: "AUD", timezone: "Australia/Sydney (AEDT +11:00)" },
  UAE: { label: "🇦🇪 UAE", taxLabel: "TRN", currency: "AED", timezone: "Asia/Dubai (GST +4:00)" },
  Singapore: { label: "🇸🇬 Singapore", taxLabel: "GST Number", currency: "SGD", timezone: "Asia/Singapore (SGT +8:00)" },
  Germany: { label: "🇩🇪 Germany", taxLabel: "Steuernummer", currency: "EUR", timezone: "Europe/Berlin (CET +1:00)" },
  France: { label: "🇫🇷 France", taxLabel: "VAT", currency: "EUR", timezone: "Europe/Paris (CET +1:00)" },
};

const COUNTRIES = Object.keys(countryDefaults) as CountryKey[];
const LANGUAGES = ["English", "Hindi", "Arabic", "French", "Spanish", "German", "Tamil", "Telugu"];

const CURRENCIES = [
  { value: "INR", label: "₹  INR — Indian Rupee" },
  { value: "USD", label: "$  USD — US Dollar" },
  { value: "GBP", label: "£  GBP — British Pound" },
  { value: "EUR", label: "€  EUR — Euro" },
  { value: "AED", label: "د.إ  AED — UAE Dirham" },
  { value: "SGD", label: "S$  SGD — Singapore Dollar" },
];

export const OrganizationStep: React.FC<{ onNext: (data: any) => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const { organization, updateData } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    language: organization.language || "English",
    country: (organization.country as CountryKey) || "India",
    timezone: organization.timezone || "Asia/Kolkata (IST +5:30)",
    currency: organization.currency || "INR",
    userName: organization.user_name || "",
    email: organization.email || "",
    password: "",
    companyName: organization.company_name || "",
    abbreviation: organization.abbr || "",
    taxNumber: organization.tax_number || "",
    installationType: (organization.installation_type as "minimal" | "advanced") || "minimal",
    generateDemo: organization.generate_demo_data !== undefined ? !!organization.generate_demo_data : false,
  });

  useEffect(() => {
    onboardsetupApi.getOrganizationContext()
      .then(res => {
        if (res) {
          setFormData(prev => ({
            ...prev,
            companyName: res.company_name || prev.companyName,
            abbreviation: res.abbr || prev.abbreviation,
            country: (res.country as CountryKey) || prev.country,
            currency: res.currency || prev.currency,
            userName: res.user_name || prev.userName,
            email: res.email || prev.email,
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const defaults = countryDefaults[formData.country as CountryKey];
    if (defaults) {
      setFormData((prev) => ({
        ...prev,
        currency: defaults.currency,
        timezone: defaults.timezone,
      }));
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.companyName) {
      const words = formData.companyName.trim().split(/\s+/);
      const generatedAbbr = words
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 5);

      setFormData((prev) => {
        if (!prev.abbreviation || prev.abbreviation.length <= 1 || /^[A-Z0-9]+$/.test(prev.abbreviation)) {
          return { ...prev, abbreviation: generatedAbbr };
        }
        return prev;
      });
    }
  }, [formData.companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.companyName || !formData.email || !formData.userName || !formData.password) {
      showToast.error("Please fill in all required fields including password");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        company_name: formData.companyName,
        abbr: formData.abbreviation,
        country: formData.country,
        timezone: formData.timezone,
        currency: formData.currency,
        user_name: formData.userName,
        email: formData.email,
        password: formData.password,
        generate_demo_data: formData.generateDemo,
      };

      const result = await onboardsetupApi.setupOrganization(payload);
      if (result.success) {
        updateData('organization', {
          ...payload,
          installation_type: formData.installationType,
          language: formData.language,
          tax_number: formData.taxNumber
        });
        onNext({ ...formData, ...result.data });
      } else {
        showToast.error(result.message || 'Failed to setup organization');
      }
    } catch (error: any) {
      showToast.error(error.message || 'A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Workspace' },
    { id: 2, label: 'Configuration' },
    { id: 3, label: 'Ready' }
  ];

  const labelCls = "text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 px-1";
  const inputCls = "w-full px-4 py-3 h-12 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 shadow-sm";

  return (
    <div className="flex flex-col items-center w-full max-w-3xl font-inter py-8">
      <StepIndicator steps={steps} currentStep={1} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 w-full overflow-hidden"
      >
        <div className="bg-blue-600 px-12 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <h2 className="text-2xl font-bold mb-2 relative z-10">Welcome to URY</h2>
          <p className="text-blue-100 text-sm font-medium relative z-10">
            Let's start by setting up your organization profile and regional preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          {/* Section: Regional Settings */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
              Regional Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelCls}>Language</label>
                <Select
                  value={formData.language}
                  onValueChange={(val) => setFormData({ ...formData, language: val })}
                  className="h-12 rounded-xl"
                >
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Primary Country</label>
                <Select
                  value={formData.country}
                  onValueChange={(val) => setFormData({ ...formData, country: val as CountryKey })}
                  className="h-12 rounded-xl"
                >
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{countryDefaults[c].label}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Currency</label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                  className="h-12 rounded-xl"
                >
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Timezone</label>
                <Select
                  value={formData.timezone}
                  onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                  className="h-12 rounded-xl"
                >
                  {countryDefaults[formData.country as CountryKey] ? (
                    <SelectItem value={formData.timezone}>{formData.timezone}</SelectItem>
                  ) : null}
                </Select>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-50 w-full" />

          {/* Section: Organization Details */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
              Organization Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelCls}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    className={cn(inputCls, "pl-11")}
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={cn(inputCls, "pl-11")}
                    placeholder="admin@restaurant.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Admin Password</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={cn(inputCls, "pl-11")}
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={cn(inputCls, "pl-11")}
                    placeholder="e.g. The Grand Cafe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Abbreviation</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.abbreviation}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                    className={cn(inputCls, "pl-11")}
                    placeholder="e.g. TGC"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Installation Strategy */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
              Installation Strategy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                onClick={() => setFormData({ ...formData, installationType: 'minimal' })}
                className={cn(
                  "relative cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 h-full flex flex-col group",
                  formData.installationType === 'minimal'
                    ? "border-blue-600 bg-blue-50/30"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  formData.installationType === 'minimal' ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                )}>
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Guided Setup</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  Best for new restaurants. We'll guide you through each configuration step.
                </p>
                {formData.installationType === 'minimal' && (
                  <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-blue-600" />
                )}
              </div>

              <div
                onClick={() => setFormData({ ...formData, installationType: 'advanced' })}
                className={cn(
                  "relative cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 h-full flex flex-col group",
                  formData.installationType === 'advanced'
                    ? "border-blue-600 bg-blue-50/30"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  formData.installationType === 'advanced' ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                )}>
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Advanced Mode</h3>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  For experienced users. Skip the wizard and configure everything from the dashboard.
                </p>
                {formData.installationType === 'advanced' && (
                  <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-gray-50">
            <Button
              variant="ghost"
              type="button"
              onClick={onBack}
              disabled={loading}
              className="gap-2 font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 h-12 px-6 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 min-w-[240px] font-bold h-12 rounded-xl bg-blue-600 shadow-xl shadow-blue-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Begin Journey
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
