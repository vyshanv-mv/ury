import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Wallet, Banknote, Loader2, Plus, Trash2, CheckCircle2, 
  ShieldCheck, Search, MoreVertical 
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardsetupApi } from '../../../../lib/onboardsetup-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Select, SelectItem } from '../../../ui/select';
import { Pagination } from '../../../ui/pagination';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from '../../../ui/dialog';

const getIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'card': return CreditCard;
    case 'wallet': return Wallet;
    default: return Banknote;
  }
};

interface PaymentForm { 
  name: string; 
  type: string; 
}

const emptyForm = (): PaymentForm => ({ name: '', type: 'Cash' });

export const PaymentStep: React.FC = () => {
  const { payments: storePayments, updateData } = useOnboardingStore();
  const payments = Array.isArray(storePayments) ? storePayments : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (payments.length > 0) return;
    setLoading(true);
    onboardsetupApi.getMopContext()
      .then(res => { if (res?.payment_methods?.length > 0) updateData('payments', res.payment_methods); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (i: number) => { 
    setForm({ ...payments[i] }); 
    setEditIndex(i); 
  };

  const cancelEdit = () => { 
    setForm(emptyForm()); 
    setEditIndex(null); 
  };

  const save = () => {
    const trimmedName = form.name?.trim();
    if (!trimmedName) { 
      showToast.error('Enter a method name'); 
      return; 
    }

    // Duplicate check
    const exists = payments.some((p, idx) => 
      p.name.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
    );
    if (exists) {
      showToast.error('This payment method already exists');
      return;
    }

    const next = [...payments];
    const entry = { name: trimmedName, type: form.type };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Payment method updated');
    } else {
      next.push(entry);
      showToast.success('Payment method added');
    }
    updateData('payments', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...payments];
    next.splice(i, 1);
    updateData('payments', next);
    showToast.success('Payment method removed');
    setEditIndex(null);
  };

  const filteredPayments = payments.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-gray-500">Fetching payment methods...</p>
        </div>
      ) : (
        <>
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <CreditCard className="w-7 h-7 text-blue-600" />
                Payment Modes
              </h2>
              <p className="text-gray-500 text-xs mt-1 font-medium">Configure different modes of payment accepted at your counter</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search modes..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-11 text-xs font-semibold bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl w-64"
                />
              </div>
              <Button onClick={() => setEditIndex(-1)} className="h-11 px-6 rounded-md gap-2 font-medium shadow-lg shadow-blue-100 bg-blue-600">
                <Plus className="w-4 h-4" />
                Add Mode
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 w-12 text-center">#</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Method Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginatedPayments.length > 0 ? (
                      paginatedPayments.map((payment, i) => {
                        const Icon = getIcon(payment.type);
                        const globalIndex = payments.findIndex(p => p === payment);
                        return (
                          <tr 
                            key={payment.name + i}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-xs font-bold text-gray-400 text-center">
                              {(currentPage - 1) * itemsPerPage + i + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {payment.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {payment.type}
                                </span>
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
                              <CreditCard className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="text-gray-400 text-sm font-bold">No methods configured</div>
                            <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-md border-gray-200 font-medium">
                              Add payment method
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

          {/* Secure Hint */}
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4 items-center shadow-sm">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Official Payment Modes</h4>
              <p className="text-xs text-emerald-700 leading-relaxed mt-0.5">
                These modes will be available for selection during the billing process. You can map them to specific accounting heads in the ERP settings later.
              </p>
            </div>
          </div>

          {/* Form Dialog */}
          <Dialog open={editIndex !== null} onOpenChange={(open) => !open && cancelEdit()}>
            <DialogContent size="lg" onClose={cancelEdit}>
              <DialogHeader className="border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {editIndex === -1 ? 'Add Payment Mode' : 'Edit Payment Mode'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Enter the display name and category for this payment method.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Method Name</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="e.g. UPI / QR Code"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Payment Category</label>
                    <Select value={form.type} onValueChange={val => setForm({...form, type: val})} className="h-11 rounded-xl">
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Wallet">Wallet / UPI</SelectItem>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="bg-gray-50/50 mt-4 border-t border-gray-100">
                {editIndex !== null && editIndex !== -1 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => remove(editIndex)} 
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold gap-2 mr-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Mode
                  </Button>
                )}
                <Button variant="ghost" onClick={cancelEdit} className="font-medium rounded-md h-11 px-6">Cancel</Button>
                <Button onClick={save} className="px-8 font-medium rounded-md h-11 shadow-lg shadow-blue-100 bg-blue-600">
                  {editIndex === -1 ? 'Add Mode' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
