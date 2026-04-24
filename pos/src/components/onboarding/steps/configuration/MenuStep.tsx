import React, { useState, useRef } from 'react';
import { Loader2, Upload, Trash2, Check, Plus, Info, Percent, Receipt, Pencil, X, Search } from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { FormField } from '../../shared/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '../../../ui/pagination';

interface MenuForm {
  item_name: string;
  standard_rate: string;
}

const emptyForm = (): MenuForm => ({ item_name: '', standard_rate: '' });

export const MenuStep: React.FC = () => {
  const { menu, updateData } = useOnboardingStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<MenuForm>(emptyForm());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Local list for easier manipulation before saving to store
  const [items, setItems] = useState<MenuForm[]>(() => {
    const storeItems = menu.items;
    if (Array.isArray(storeItems) && storeItems.length > 0) {
      return storeItems.map((it: any) => ({
        item_name: it.item_name || it.name || '',
        standard_rate: String(it.standard_rate || it.price || ''),
      }));
    }
    return [];
  });

  const saveToStore = (newItems: MenuForm[]) => {
    updateData('menu', { items: newItems });
  };

  const openEdit = (i: number) => {
    setForm({ ...items[i] });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyForm());
    setEditIndex(null);
  };

  const handleSaveItem = () => {
    if (!form.item_name.trim() || !form.standard_rate) {
      showToast.error('Item name and price are required');
      return;
    }
    const next = [...items];
    if (editIndex !== null) {
      next[editIndex] = form;
      showToast.success('Item updated');
    } else {
      next.push(form);
      showToast.success('Item added');
    }
    setItems(next);
    saveToStore(next);
    cancelEdit();
  };

  const removeItem = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    saveToStore(next);
  };

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

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const nameIdx = headers.findIndex(h => h === 'item_name' || h === 'name');
        const priceIdx = headers.findIndex(h => h === 'standard_rate' || h === 'price' || h === 'rate');

        if (nameIdx === -1) { showToast.error('CSV must have an "item_name" or "name" column'); return; }

        const imported: MenuForm[] = lines.slice(1)
          .map(line => {
            const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            return {
              item_name: cols[nameIdx] ?? '',
              standard_rate: priceIdx !== -1 ? (cols[priceIdx] ?? '') : '',
            };
          })
          .filter(r => r.item_name);

        if (imported.length === 0) { showToast.error('No valid items found in file'); return; }

        const next = [...items, ...imported];
        setItems(next);
        saveToStore(next);
        showToast.success(`${imported.length} items imported`);
      } catch {
        showToast.error('Failed to parse file');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = items.filter(it => 
    it.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
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

        {/* Menu Items List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Menu Items</h4>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search menu..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs font-semibold bg-background/50 border-border/50 focus:bg-background transition-all"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="font-bold gap-2 text-xs h-9 px-4"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {isUploading ? 'Importing...' : 'Upload CSV'}
              </Button>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[140px]">
            <AnimatePresence mode="popLayout">
              {paginatedItems.map((item) => {
                const realIndex = items.indexOf(item);
                return (
                  <motion.div
                    key={`${item.item_name}-${realIndex}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-5 bg-card rounded-2xl border border-border shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground line-clamp-1">{item.item_name}</p>
                        <p className="text-xs font-bold text-primary">₹ {item.standard_rate}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(realIndex)} className="w-8 h-8 text-primary hover:bg-primary/10">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(realIndex)} className="w-8 h-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-secondary/5 rounded-[2rem] border border-dashed border-border">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-foreground">No menu items found</h5>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search term or add a new item.</p>
              </div>
            )}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Add / Edit Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <Plus className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              {editIndex !== null ? 'Edit Item' : 'Add New Item'}
            </h4>
          </div>

          <div className="p-6 bg-secondary/10 rounded-2xl border border-border/50 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-2 w-full">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Item Name</label>
              <Input
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                className="w-full text-sm font-semibold h-11"
                placeholder="e.g. Chicken Biryani"
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Rate (₹)</label>
              <Input
                type="number"
                value={form.standard_rate}
                onChange={(e) => setForm({ ...form, standard_rate: e.target.value })}
                className="w-full text-sm font-bold h-11"
                placeholder="250.00"
              />
            </div>
            <div className="flex gap-2">
              {editIndex !== null && (
                <Button variant="outline" size="lg" onClick={cancelEdit} className="h-11 px-6 font-bold gap-2">
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button size="lg" onClick={handleSaveItem} className="h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/10">
                {editIndex !== null ? <><Check className="w-5 h-5" /> Update</> : <><Plus className="w-5 h-5" /> Add Item</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0 text-muted-foreground border border-border shadow-sm">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Menu Optimization</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Start by adding your most popular items. You can use the CSV upload to import a large menu instantly. All changes are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
