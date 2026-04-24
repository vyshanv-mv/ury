import React, { useState, useRef } from 'react';
import { Loader2, Upload, Trash2, Check, Plus, Info, Percent, Receipt, FileText } from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { FormField } from '../../shared/FormField';

interface RowItem {
  item_name: string;
  standard_rate: string;
}

const emptyRow = (): RowItem => ({ item_name: '', standard_rate: '' });
const DEFAULT_ROWS = 5;

export const MenuStep: React.FC = () => {
  const { menu, updateData } = useOnboardingStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable rows — initialise from store or show default empty rows
  const [rows, setRows] = useState<RowItem[]>(() => {
    if (menu.items && menu.items.length > 0) {
      return menu.items.map((it: any) => ({
        item_name: it.item_name || it.name || '',
        standard_rate: String(it.standard_rate || it.price || ''),
      }));
    }
    return Array.from({ length: DEFAULT_ROWS }, emptyRow);
  });

  /* ── helpers ── */
  const updateRow = (i: number, field: keyof RowItem, value: string) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (i: number) => {
    setRows((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length === 0 ? [emptyRow()] : next;
    });
  };

  /* ── Upload: parse CSV client-side, populate rows directly ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { showToast.error('File must have a header row and at least one item'); return; }

        // Parse header — support flexible column names
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const nameIdx = headers.findIndex(h => h === 'item_name' || h === 'name');
        const priceIdx = headers.findIndex(h => h === 'standard_rate' || h === 'price' || h === 'rate');

        if (nameIdx === -1) { showToast.error('CSV must have an "item_name" or "name" column'); return; }

        const imported: RowItem[] = lines.slice(1)
          .map(line => {
            const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            return {
              item_name: cols[nameIdx] ?? '',
              standard_rate: priceIdx !== -1 ? (cols[priceIdx] ?? '') : '',
            };
          })
          .filter(r => r.item_name);

        if (imported.length === 0) { showToast.error('No valid items found in file'); return; }

        const existing = rows.filter(r => r.item_name.trim() || r.standard_rate.trim());
        const merged = [...existing, ...imported];
        setRows(merged);
        showToast.success(`${imported.length} item${imported.length !== 1 ? 's' : ''} imported`);
      } catch {
        showToast.error('Failed to parse file — check the format');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast.error('Could not read file');
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  /* ── Save valid rows to store ── */
  const handleSave = () => {
    const valid = rows.filter(r => r.item_name.trim() && Number(r.standard_rate) > 0);
    if (valid.length === 0) { showToast.error('Add at least one item with a valid price'); return; }
    updateData('menu', { items: valid });
    showToast.success(`${valid.length} items saved`);
  };

  const filledCount = rows.filter(r => r.item_name.trim()).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Tax Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <Percent className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Tax Settings</h4>
          </div>

          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="w-full sm:w-1/3">
                <FormField
                  label="Tax Rate (%)"
                  type="number"
                  placeholder="5"
                  value={menu.tax_rate ?? ''}
                  onChange={(e) => updateData('menu', { tax_rate: e.target.value })}
                />
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
                  Tax Calculation
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'Inclusive', subtitle: 'Tax within price' },
                    { value: 'Exclusive', subtitle: 'Tax added on top' },
                  ].map(({ value, subtitle }) => {
                    const selected = menu.tax_calculation === value || (!menu.tax_calculation && value === 'Inclusive');
                    return (
                      <button
                        key={value}
                        onClick={() => updateData('menu', { tax_calculation: value })}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/20'
                          }`}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-primary' : 'border-muted-foreground/40'
                          }`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </span>
                        <span>
                          <span className={`block text-xs font-bold ${selected ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                          <span className="block text-xs text-muted-foreground opacity-80">{subtitle}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Items & Pricing</h4>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="font-bold gap-2 text-xs h-9"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {isUploading ? 'Importing...' : 'Upload CSV'}
              </Button>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border-b border-border">
              <span className="flex-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">Item Name</span>
              <span className="w-24 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right mr-4">Price (₹)</span>
              <span className="w-10" />
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/50 max-h-96 overflow-y-auto custom-scrollbar">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-2 group hover:bg-secondary/10 transition-colors">
                  <div className="flex-1 px-2">
                    <Input
                      type="text"
                      placeholder={`Item ${i + 1}`}
                      value={row.item_name}
                      onChange={(e) => updateRow(i, 'item_name', e.target.value)}
                      className="w-full text-sm font-semibold bg-transparent border-transparent focus:bg-background border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="w-24 flex items-center">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={row.standard_rate}
                      onChange={(e) => updateRow(i, 'standard_rate', e.target.value)}
                      className="w-full text-sm font-bold bg-transparent border-transparent focus:bg-background border-none shadow-none text-right focus-visible:ring-1 focus-visible:ring-primary/30 pr-4"
                    />
                  </div>
                  <div className="w-10 flex justify-center">
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeRow(i)}
                      className="w-8 h-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/5 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={addRow}
                className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Row
              </Button>

              <div className="flex items-center gap-4">
                {filledCount > 0 && (
                  <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md uppercase tracking-wider">
                    {filledCount} Item{filledCount !== 1 ? 's' : ''} Ready
                  </span>
                )}
                <Button onClick={handleSave} size="sm" className="font-bold gap-2 px-4 shadow-md shadow-primary/20">
                  <Check className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium py-2">
            <FileText className="w-3.5 h-3.5 opacity-50" />
            <span>Empty rows are automatically ignored. You can always edit this later.</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0 text-muted-foreground border border-border shadow-sm">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Menu & Pricing</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Adding your top selling items now helps you get started quickly. You can upload your full menu using a CSV template or enter them manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

