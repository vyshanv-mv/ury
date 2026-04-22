import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui/button';
import { Input as BaseInput } from '../ui/input';
import { Select as BaseSelect, SelectItem } from '../ui/select';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SetupCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card text-card-foreground shadow-xl shadow-primary-900/5 rounded-2xl p-8 border border-border", className)}>
    {children}
  </div>
);

export const PrimaryButton = ({ 
  children, 
  onClick, 
  className, 
  disabled,
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline'
}) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
      variant={variant as any}
      size="lg"
      className={cn("rounded-xl px-8", className)}
    >
      {children}
    </Button>
  );
};

export const FormField = ({ label, children, error, required, helperText, helperTextClass }: { label: string; children: React.ReactNode; error?: string; required?: boolean; helperText?: string; helperTextClass?: string; }) => (
  <div className="space-y-1.5 w-full text-left flex flex-col">
    <label className="text-sm font-normal text-foreground ml-1">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-destructive mt-1">{error}</p>
    ) : helperText ? (
      <p className={cn("text-xs mt-1", helperTextClass || "text-muted-foreground")}>{helperText}</p>
    ) : null}
  </div>
);

export const Input = (props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>) => (
  <BaseInput 
    {...props}
    className={cn("font-normal", props.className)}
  />
);

export const Select = ({ options, value, onChange, placeholder, disabled }: { options: { label: string; value: string }[], value: string, onChange: (val: string) => void, placeholder?: string, disabled?: boolean }) => (
  <BaseSelect
    value={value}
    onValueChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
  >
    {options.map(opt => (
      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
    ))}
  </BaseSelect>
);
