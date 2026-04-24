import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, Banknote, Loader2, Plus, Trash2, CheckCircle2, ShieldCheck, Pencil, X, Check, Search } from 'lucide-react';
import { Button } from '../../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Select, SelectItem } from '../../../ui/select';
import { Pagination } from '../../../ui/pagination';

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'card': return CreditCard;
    case 'wallet': return Wallet;
    default: return Banknote;
  }
};

interface PaymentForm { name: string; type: string; }
const emptyForm = (): PaymentForm => ({ name: '', type: 'Cash' });

export const PaymentStep: React.FC = () => {
  const { payments: storePayments, updateData } = useOnboardingStore();
  const payments = Array.isArray(storePayments) ? storePayments : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (payments.length > 0) return;
    setLoading(true);
    onboardingApi.getMopContext()
      .then(res => { if (res?.payment_methods?.length > 0) updateData('payments', res.payment_methods); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (i: number) => { setForm({ ...payments[i] }); setEditIndex(i); };
  const cancelEdit = () => { setForm(emptyForm()); setEditIndex(null); };

  const save = () => {
    if (!form.name.trim()) { showToast.error('Enter a method name'); return; }
    const next = [...payments];
    const entry = { name: form.name.trim(), type: form.type };
    if (editIndex !== null) { next[editIndex] = entry; showToast.success('Payment method updated'); }
    else { next.push(entry); showToast.success('Payment method added'); }
    updateData('payments', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...payments]; next.splice(i, 1); updateData('payments', next);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Fetching payment methods...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <CreditCard className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Payment Methods</h4>
        </div>

        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search methods..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs font-semibold bg-background/50 border-border/50 focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Payment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {paginatedPayments.map((payment) => {
            const Icon = getIcon(payment.type);
            const realIndex = payments.indexOf(payment);
            return (
              <motion.div key={`${payment.name}-${realIndex}`}
                layout
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="p-5 bg-card rounded-2xl border border-border shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{payment.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{payment.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(realIndex)} className="text-primary hover:bg-primary/10 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(realIndex)} className="text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredPayments.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-secondary/5 rounded-[2rem] border border-dashed border-border">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-foreground">No methods found</h5>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search term or add a new method below.</p>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Add / Edit form */}
      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Method Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
            placeholder="e.g. UPI / QR"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Type</label>
          <Select
            value={form.type}
            onValueChange={(val) => setForm({ ...form, type: val })}
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
          >
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="Wallet">Wallet</SelectItem>
          </Select>
        </div>
        <div className="flex gap-2">
          {editIndex !== null && (
            <Button variant="outline" size="lg" onClick={cancelEdit} className="font-bold gap-2 flex-1">
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
          <Button size="lg" onClick={save} className="font-bold gap-2 flex-1 w-full sm:w-auto">
            {editIndex !== null ? <><Check className="w-5 h-5" /> Update</> : <><Plus className="w-5 h-5" /> Add Method</>}
          </Button>
        </div>
      </div>

      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Secure Payments</h4>
          <p className="text-xs text-emerald-700 leading-relaxed mt-1">
            Configure the payment methods supported at your POS. Advanced integrations can be added later from settings.
          </p>
        </div>
      </div>
    </div>
  );
};
