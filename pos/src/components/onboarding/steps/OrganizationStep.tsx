import React, { useState, useEffect } from 'react';
import {
  Zap, Building2, Tag, Loader2,
  User, Mail, Globe, Clock, Coins, CheckCircle2, Sliders, ArrowLeft, ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { StepIndicator } from '../shared/StepIndicator';
import { showToast } from '../../ui/toast';
import { useOnboardingStore } from '../../../store/onboarding-store';
import { onboardingApi } from '../../../lib/onboarding-api';
import { Input } from '../../ui/input';
import { Select, SelectItem } from '../../ui/select';
import { Button } from '../../ui/button';

type CountryKey =
  | "India" | "United States" | "United Kingdom" | "Canada"
  | "Australia" | "UAE" | "Singapore" | "Germany" | "France";

const countryDefaults: Record<CountryKey, { label: string; taxLabel: string; currency: string; timezone: string }> = {
  India: { label: "IN India", taxLabel: "GSTIN", currency: "INR", timezone: "Asia/Kolkata (IST +5:30)" },
  "United States": { label: "US United States", taxLabel: "EIN", currency: "USD", timezone: "America/New_York (EST -5:00)" },
  "United Kingdom": { label: "GB United Kingdom", taxLabel: "VAT Number", currency: "GBP", timezone: "Europe/London (GMT +0:00)" },
  Canada: { label: "CA Canada", taxLabel: "Business Number", currency: "CAD", timezone: "America/Toronto (EST -5:00)" },
  Australia: { label: "AU Australia", taxLabel: "ABN", currency: "AUD", timezone: "Australia/Sydney (AEDT +11:00)" },
  UAE: { label: "AE UAE", taxLabel: "TRN", currency: "AED", timezone: "Asia/Dubai (GST +4:00)" },
  Singapore: { label: "SG Singapore", taxLabel: "GST Number", currency: "SGD", timezone: "Asia/Singapore (SGT +8:00)" },
  Germany: { label: "DE Germany", taxLabel: "Steuernummer", currency: "EUR", timezone: "Europe/Berlin (CET +1:00)" },
  France: { label: "FR France", taxLabel: "VAT", currency: "EUR", timezone: "Europe/Paris (CET +1:00)" },
};

const COUNTRIES = Object.keys(countryDefaults) as CountryKey[];

const LANGUAGES = ["English", "Hindi", "Arabic", "French", "Spanish", "German", "Tamil", "Telugu"];

const TIMEZONES = [
  "Asia/Kolkata (IST +5:30)",
  "America/New_York (EST -5:00)",
  "America/Los_Angeles (PST -8:00)",
  "Europe/London (GMT +0:00)",
  "Europe/Berlin (CET +1:00)",
  "Asia/Dubai (GST +4:00)",
  "Asia/Singapore (SGT +8:00)",
  "Australia/Sydney (AEDT +11:00)",
];

const CURRENCIES = [
  { value: "INR", label: "₹  INR — Indian Rupee" },
  { value: "USD", label: "$  USD — US Dollar" },
  { value: "GBP", label: "£  GBP — British Pound" },
  { value: "EUR", label: "€  EUR — Euro" },
  { value: "AED", label: "د.إ  AED — UAE Dirham" },
  { value: "SGD", label: "S$  SGD — Singapore Dollar" },
  { value: "CAD", label: "CA$  CAD — Canadian Dollar" },
  { value: "AUD", label: "A$  AUD — Australian Dollar" },
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
    companyName: organization.company_name || "",
    abbreviation: organization.abbr || "",
    taxNumber: organization.tax_number || "",
    installationType: (organization.installation_type as "minimal" | "advanced") || "minimal",
    generateDemo: organization.generate_demo_data !== undefined ? !!organization.generate_demo_data : false,
  });

  // Smart defaults when country changes
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

  // Auto-generate abbreviation from company name
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
    } else {
      setFormData(prev => ({ ...prev, abbreviation: '' }));
    }
  }, [formData.companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

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
        generate_demo_data: formData.generateDemo,
        // We can add installation_type to the payload if the backend supports it
        // installation_type: formData.installationType
      };

      const result = await onboardingApi.setupOrganization(payload);
      if (result.success) {
        // Save to store with snake_case keys to match backend/store expectations
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
      console.error('Setup error:', error);
      showToast.error(error.message || 'A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Organization' },
    { id: 2, label: 'Configuration' },
    { id: 3, label: 'Finalize' }
  ];

  const taxLabel = countryDefaults[formData.country as CountryKey]?.taxLabel || "Tax Number";
  const labelCls = "text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2";
  const inputCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm";

  return (
    <div className="flex flex-col items-center w-full max-w-2xl font-inter animate-in fade-in duration-500 py-8">
      <StepIndicator steps={steps} currentStep={1} />

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full overflow-hidden">
        <div className="bg-primary px-10 py-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Setup Your Workspace</h2>
          <p className="text-primary-50/80 text-base">
            Configure basic details to personalize your URY experience
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Language + Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="language" className={labelCls}>
                <Globe className="w-4 h-4 text-gray-400" />
                Language
              </label>
              <Select
                value={formData.language}
                onValueChange={(val) => setFormData({ ...formData, language: val })}
                disabled={loading}
              >
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="country" className={labelCls}>
                <Globe className="w-4 h-4 text-gray-400" />
                Country
              </label>
              <Select
                value={formData.country}
                onValueChange={(val) => setFormData({ ...formData, country: val as CountryKey })}
                disabled={loading}
              >
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{countryDefaults[c].label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Timezone + Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="timezone" className={labelCls}>
                <Clock className="w-4 h-4 text-gray-400" />
                Timezone
              </label>
              <Select
                value={formData.timezone}
                onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                disabled={loading}
              >
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="currency" className={labelCls}>
                <Coins className="w-4 h-4 text-gray-400" />
                Currency
              </label>
              <Select
                value={formData.currency}
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
                disabled={loading}
              >
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* User Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="userName" className={labelCls}>
                <User className="w-4 h-4 text-gray-400" />
                User Name
              </label>
              <Input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                required
                className={inputCls}
                placeholder="Your full name"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>
                <Mail className="w-4 h-4 text-gray-400" />
                Email Address
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={inputCls}
                placeholder="admin@restaurant.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Company Name + Abbreviation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className={labelCls}>
                <Building2 className="w-4 h-4 text-gray-400" />
                Company Name
              </label>
              <Input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className={inputCls}
                placeholder="e.g. The Grand Cafe"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="abbreviation" className={labelCls}>
                <Tag className="w-4 h-4 text-gray-400" />
                Abbreviation
              </label>
              <Input
                type="text"
                id="abbreviation"
                name="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                required
                className={inputCls}
                placeholder="e.g. TGC"
                disabled={loading}
                maxLength={5}
              />
            </div>
          </div>

          {/* Tax ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="taxNumber" className={labelCls}>
                <Tag className="w-4 h-4 text-gray-400" />
                {taxLabel} <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="text"
                id="taxNumber"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className={inputCls}
                placeholder={`Enter ${taxLabel}`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Installation Type */}
          <div className="space-y-4">
            <label className="text-base font-semibold text-foreground">Installation Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div
                onClick={() => !loading && setFormData({ ...formData, installationType: 'minimal' })}
                className={cn(
                  "relative cursor-pointer p-6 rounded-lg border-2 transition-all duration-300 h-full flex flex-col",
                  formData.installationType === 'minimal'
                    ? "border-primary bg-primary-50/30"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                {formData.installationType === 'minimal' && (
                  <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle2 className="w-6 h-6 fill-primary text-white" />
                  </div>
                )}
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">Minimal Installation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Quick setup with guided configuration. Ideal for most restaurants.
                </p>
                <div className="mt-auto">
                  <span className="inline-flex px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider rounded-md">
                    Recommended
                  </span>
                </div>
              </div>

              <div
                onClick={() => !loading && setFormData({ ...formData, installationType: 'advanced' })}
                className={cn(
                  "relative cursor-pointer p-6 rounded-lg border-2 transition-all duration-300 h-full flex flex-col",
                  formData.installationType === 'advanced'
                    ? "border-primary bg-primary-50/30"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                {formData.installationType === 'advanced' && (
                  <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle2 className="w-6 h-6 fill-primary text-white" />
                  </div>
                )}
                <div className="w-12 h-12 bg-gray-100/80 rounded-2xl flex items-center justify-center mb-5">
                  <Sliders className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">Advanced Installation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Skip setup wizard, go directly to the full dashboard.
                </p>
                <div className="mt-auto">
                  <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider rounded-md">
                    For experienced users
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Data - Small checkbox style if needed, but not in image. I'll keep it subtle. */}
          {/* Note: Image doesn't show demo data checkbox. I'll hide it or keep it very subtle if requested. */}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 bg-secondary/30 -mx-10 -mb-10 px-10 py-6">
            <Button
              variant="ghost"
              type="button"
              onClick={onBack}
              disabled={loading}
              className="gap-2 font-bold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="gap-2 min-w-[240px] font-bold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Start Setup
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

