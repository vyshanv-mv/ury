import React from 'react';
import { Input } from '../../ui/input';
import { Select, SelectItem } from '../../ui/select';

interface FormFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled,
  options,
  icon,
  required
}) => (
  <div className="space-y-1.5 group">
    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70 group-focus-within:text-primary group-focus-within:opacity-100 transition-all">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
          {icon}
        </div>
      )}
      {type === 'select' ? (
        <div className="relative w-full">
          <Select
            disabled={disabled}
            value={value}
            onValueChange={(val) => onChange?.({ target: { value: val } } as any)}
            className={icon ? 'pl-10' : ''}
          >
            {options?.map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </Select>
        </div>
      ) : (
        <Input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={icon ? 'pl-10' : ''}
        />
      )}
    </div>
  </div>
);
