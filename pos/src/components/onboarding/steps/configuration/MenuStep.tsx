import React, { useState, useRef } from 'react';
import { 
  Loader2, Upload, Trash2, Plus, Percent, Receipt, Search, MoreVertical 
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Pagination } from '../../../ui/pagination';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from '../../../ui/dialog';

interface MenuForm {
  item_name: string;
  price: number;
}

const emptyForm = (): MenuForm => ({ item_name: '', price: 0 });

export const MenuStep: React.FC = () => {
  const { menu, updateData } = useOnboardingStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<MenuForm>(emptyForm());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const items: MenuForm[] = Array.isArray(menu.items) ? menu.items.map((it) => ({
    item_name: it.item_name || '',
    price: it.price || 0,
  })) : [];

  const saveToStore = (newItems: MenuForm[]) => {
    updateData('menu', { ...menu, items: newItems });
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
    const trimmedName = form.item_name?.trim();
    const price = form.price;

    if (!trimmedName || isNaN(price) || price <= 0) {
      showToast.error('Item name and a valid price are required');
      return;
    }

    // Duplicate check
    const exists = items.some((it, idx) => 
      it.item_name.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
    );
    if (exists) {
      showToast.error('An item with this name already exists');
      return;
    }

    const next = [...items];
    const entry = { item_name: trimmedName, price };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Item updated');
    } else {
      next.push(entry);
      showToast.success('Item added');
    }
    saveToStore(next);
    cancelEdit();
  };

  const removeItem = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    saveToStore(next);
    showToast.success('Item removed');
    setEditIndex(null);
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
            const rawPrice = priceIdx !== -1 ? cols[priceIdx] : '0';
            return {
              item_name: cols[nameIdx] ?? '',
              price: parseFloat(rawPrice) || 0,
            };
          })
          .filter(r => r.item_name);

        if (imported.length === 0) { showToast.error('No valid items found in file'); return; }

        const next = [...items, ...imported];
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

  return (
    <div className="space-y-6">
      {/* Tax Quick Settings */}
      <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0 text-blue-600">
          <Percent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">Tax Configuration</h4>
          <p className="text-xs text-gray-500 font-medium">Set global tax rate and calculation method</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-32">
            <Input 
              type="number"
              placeholder="5.0"
              value={menu.tax_rate ?? ''}
              onChange={(e) => updateData('menu', { ...menu, tax_rate: e.target.value })}
              className="h-11 rounded-md pr-8 font-medium border-gray-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">%</span>
          </div>
          <div className="flex bg-gray-50 p-1 rounded-md border border-gray-100">
            {['Inclusive', 'Exclusive'].map((type) => (
              <button
                key={type}
                onClick={() => updateData('menu', { ...menu, tax_calculation: type as 'Inclusive' | 'Exclusive' })}
                className={`px-4 py-2 text-[10px] font-medium rounded-md transition-all ${
                  (menu.tax_calculation || 'Inclusive') === type 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-md border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-medium text-gray-900 flex items-center gap-3">
            <Receipt className="w-7 h-7 text-blue-600" />
            Menu Management
          </h2>
          <p className="text-gray-500 text-xs mt-1 font-medium">Create your menu items or import them from a CSV file</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-11 text-xs font-medium bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-md w-64"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="h-11 px-4 rounded-md gap-2 font-medium border-gray-200"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import
          </Button>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <Button onClick={() => setEditIndex(-1)} className="h-11 px-6 rounded-md gap-2 font-medium shadow-lg shadow-blue-100 bg-blue-600">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-medium text-gray-500 w-12 text-center">#</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500">Item Details</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500">Standard Rate</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, i) => {
                    const globalIndex = items.findIndex(it => it === item);
                    return (
                      <tr 
                        key={item.item_name + i}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-xs font-medium text-gray-400 text-center">
                          {(currentPage - 1) * itemsPerPage + i + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                              <Receipt className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.item_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-600">
                            ₹ {item.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEdit(globalIndex)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-white hover:shadow-md transition-all"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <Receipt className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="text-gray-400 text-sm font-medium">No menu items configured</div>
                        <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-md border-gray-200 font-medium">
                          Add your first item
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Area */}
      <div className="pt-4 border-t border-gray-100">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={editIndex !== null} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent size="lg" onClose={cancelEdit}>
          <DialogHeader className="border-b border-gray-100 pb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-medium text-gray-900">
              {editIndex === -1 ? 'Add New Menu Item' : 'Edit Item Details'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Define the item name and its standard selling price.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-medium text-gray-500 ml-1">Item Name</label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={form.item_name} 
                    onChange={e => setForm({...form, item_name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleSaveItem()}
                    placeholder="e.g. Chicken Biryani Full"
                    className="pl-10 rounded-md border-gray-200 bg-white h-11 font-medium" 
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-medium text-gray-500 ml-1">Standard Rate (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                  <Input 
                    type="number"
                    value={form.price} 
                    onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})}
                    onKeyDown={e => e.key === 'Enter' && handleSaveItem()}
                    placeholder="250.00"
                    className="pl-10 rounded-md border-gray-200 bg-white h-11 font-medium" 
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50/50 mt-4 border-t border-gray-100">
            {editIndex !== null && editIndex !== -1 && (
              <Button 
                variant="ghost" 
                onClick={() => removeItem(editIndex)} 
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium gap-2 mr-auto"
              >
                <Trash2 className="w-4 h-4" />
                Delete Item
              </Button>
            )}
            <Button variant="ghost" onClick={cancelEdit} className="font-medium rounded-md h-11 px-6">Cancel</Button>
            <Button onClick={handleSaveItem} className="px-8 font-medium rounded-md h-11 shadow-lg shadow-blue-100 bg-blue-600">
              {editIndex === -1 ? 'Add Item' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
