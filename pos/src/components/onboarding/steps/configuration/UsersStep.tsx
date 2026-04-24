import React, { useEffect, useState } from 'react';
import { User, Shield, Loader2, Trash2, UserPlus, Pencil, X, Check, Search } from 'lucide-react';
import { Button } from '../../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Select, SelectItem } from '../../../ui/select';
import { Pagination } from '../../../ui/pagination';

interface UserForm { name: string; role: string; }
const emptyForm = (): UserForm => ({ name: '', role: 'Cashier' });

const ROLE_COLORS: Record<string, string> = {
  Administrator: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  Cashier: 'bg-emerald-100 text-emerald-700',
  Waiter: 'bg-amber-100 text-amber-700',
};

export const UsersStep: React.FC = () => {
  const { users: storeUsers, updateData } = useOnboardingStore();
  const users = Array.isArray(storeUsers) ? storeUsers : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    if (users.length > 0) return;
    setLoading(true);
    onboardingApi.getUserManagementContext()
      .then(res => { if (res?.users?.length > 0) updateData('users', res.users); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (i: number) => { setForm({ ...users[i] }); setEditIndex(i); };
  const cancelEdit = () => { setForm(emptyForm()); setEditIndex(null); };

  const save = () => {
    if (!form.name.trim()) { showToast.error('Enter the user name'); return; }
    const next = [...users];
    const entry = { name: form.name.trim(), role: form.role };
    if (editIndex !== null) { next[editIndex] = entry; showToast.success('User updated'); }
    else { next.push(entry); showToast.success('User added'); }
    updateData('users', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...users]; next.splice(i, 1); updateData('users', next);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Fetching team members...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Team Members</h4>
        </div>

        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search team..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs font-semibold bg-background/50 border-border/50 focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[140px]">
        <AnimatePresence mode="popLayout">
          {paginatedUsers.map((u) => {
            const realIndex = users.indexOf(u);
            return (
              <motion.div key={`${u.name}-${realIndex}`}
                layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 bg-card rounded-2xl border border-border shadow-sm group hover:border-primary/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{u.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${ROLE_COLORS[u.role] ?? 'bg-secondary text-muted-foreground'}`}>
                      {u.role}
                    </span>
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

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-secondary/5 rounded-[2rem] border border-dashed border-border">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-foreground">No team members found</h5>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search term or add a new user.</p>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Add / Edit form */}
      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="w-full">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Full Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
            placeholder="e.g. Jane Doe"
          />
        </div>
        <div className="w-full">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Role</label>
          <Select
            value={form.role}
            onValueChange={(val) => setForm({ ...form, role: val })}
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
          >
            <SelectItem value="Administrator">Administrator</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Cashier">Cashier</SelectItem>
            <SelectItem value="Waiter">Waiter</SelectItem>
          </Select>
        </div>
        <div className="flex gap-2">
          {editIndex !== null && (
            <Button variant="outline" size="lg" onClick={cancelEdit} className="gap-2 flex-1 font-bold">
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
          <Button size="lg" onClick={save} className="font-bold gap-2 flex-1 w-full sm:w-auto">
            {editIndex !== null
              ? <><Check className="w-5 h-5" /> Update</>
              : <><UserPlus className="w-5 h-5" /> Add</>}
          </Button>
        </div>
      </div>

      <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Final Security Step</h4>
          <p className="text-xs text-blue-700 leading-relaxed mt-1">
            Once setup is complete, your organization will be locked and you'll be redirected to the POS dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
