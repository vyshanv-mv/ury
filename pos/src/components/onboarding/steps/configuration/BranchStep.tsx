import React, { useEffect, useState } from 'react';
import { FormField } from '../../shared/FormField';
import { Info, Building2, Phone, Mail, Navigation, Loader2, Plus, Trash2, Pencil, X, Check, Search } from 'lucide-react';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { Button } from '../../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Pagination } from '../../../ui/pagination';

interface BranchForm {
  branch_name: string;
  branch_phone: string;
  branch_email: string;
  branch_address: string;
}

const emptyBranch = (): BranchForm => ({
  branch_name: '',
  branch_phone: '',
  branch_email: '',
  branch_address: '',
});

export const BranchStep: React.FC = () => {
  const { branch: storeBranches, updateData } = useOnboardingStore();
  const branches = Array.isArray(storeBranches) ? storeBranches : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BranchForm>(emptyBranch());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchContext = async () => {
      if (branches.length > 0) return;
      setLoading(true);
      try {
        const response = await onboardingApi.getBranchContext();
        if (response && response.branch_name) {
          // If we get a single branch from context, put it in the list
          updateData('branch', [response]);
        }
      } catch (error) {
        console.warn('Could not fetch branch context, starting fresh');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handleChange = (field: keyof BranchForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openEdit = (i: number) => {
    setForm({ ...branches[i] });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyBranch());
    setEditIndex(null);
  };

  const save = () => {
    if (!form.branch_name.trim() || !form.branch_address.trim()) {
      showToast.error('Branch name and address are required');
      return;
    }
    const next = [...branches];
    if (editIndex !== null) {
      next[editIndex] = form;
      showToast.success('Branch updated');
    } else {
      next.push(form);
      showToast.success('Branch added');
    }
    updateData('branch', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...branches];
    next.splice(i, 1);
    updateData('branch', next);
    showToast.success('Branch removed');
  };

  const filteredBranches = branches.filter(b => 
    b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.branch_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Fetching branch details...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* List Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Configured Branches</h4>
              </div>

              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search branches..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs font-semibold bg-background/50 border-border/50 focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[140px]">
              <AnimatePresence mode="popLayout">
                {paginatedBranches.map((b) => {
                  const realIndex = branches.indexOf(b);
                  return (
                    <motion.div
                      key={`${b.branch_name}-${realIndex}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{b.branch_name}</p>
                          <p className="text-xs font-medium text-gray-500 truncate max-w-[180px]">
                            {b.branch_address}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(realIndex)}
                          className="text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(realIndex)}
                          className="text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredBranches.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-gray-900">No branches found</h5>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your search term or add a new branch below.</p>
                </div>
              )}
            </div>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                {editIndex !== null ? 'Edit Branch' : 'Add New Branch'}
              </h4>
            </div>

            <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Branch Name"
                  placeholder="e.g. Downtown Outlet"
                  icon={<Building2 className="w-4 h-4" />}
                  value={form.branch_name}
                  onChange={(e) => handleChange('branch_name', e.target.value)}
                  required
                />
                <FormField
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  icon={<Phone className="w-4 h-4" />}
                  value={form.branch_phone}
                  onChange={(e) => handleChange('branch_phone', e.target.value)}
                />
                <FormField
                  label="Branch Email"
                  placeholder="downtown@restaurant.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={form.branch_email}
                  onChange={(e) => handleChange('branch_email', e.target.value)}
                />
                <FormField
                  label="Full Address"
                  placeholder="Street name, City, Pincode"
                  icon={<Navigation className="w-4 h-4" />}
                  value={form.branch_address}
                  onChange={(e) => handleChange('branch_address', e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                {editIndex !== null && (
                  <Button variant="outline" onClick={cancelEdit} className="font-bold gap-2 rounded-xl h-11 px-6">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                )}
                <Button onClick={save} className="font-bold gap-2 rounded-xl h-11 px-8 shadow-lg shadow-blue-100">
                  {editIndex !== null ? (
                    <><Check className="w-4 h-4" /> Update Branch</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add Branch</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 border border-blue-200">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900">Multi-Outlet Management</h4>
              <p className="text-xs text-blue-700 leading-relaxed mt-1">
                You can add multiple branches for your restaurant. Each branch can have its own address, contact info, and operational settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
