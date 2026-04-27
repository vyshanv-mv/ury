import React, { useEffect, useState } from 'react';
import { 
  Building2, Phone, Mail, Navigation, Loader2, 
  Plus, Trash2, Search, MoreVertical, Building
} from 'lucide-react';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardsetupApi } from '../../../../lib/onboardsetup-api';
import { Button } from '../../../ui/button';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Pagination } from '../../../ui/pagination';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from '../../../ui/dialog';

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
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchContext = async () => {
      if (branches.length > 0) return;
      setLoading(true);
      try {
        const response = await onboardsetupApi.getBranchContext();
        if (response && response.branch_name) {
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

  const openEdit = (i: number) => {
    setForm({ ...branches[i] });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyBranch());
    setEditIndex(null);
  };

  const save = () => {
    const trimmedName = form.branch_name?.trim();
    const trimmedAddress = form.branch_address?.trim();
    
    if (!trimmedName || !trimmedAddress) {
      showToast.error('Branch name and address are required');
      return;
    }

    // Duplicate check
    const exists = branches.some((b, idx) => 
      b.branch_name.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
    );
    if (exists) {
      showToast.error('A branch with this name already exists');
      return;
    }

    const next = [...branches];
    const entry = { ...form, branch_name: trimmedName, branch_address: trimmedAddress };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Branch updated');
    } else {
      next.push(entry);
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
    setEditIndex(null);
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

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Fetching branch details...</p>
        </div>
      ) : (
        <>
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-md border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                <Building2 className="w-7 h-7 text-blue-600" />
                Branches
              </h2>
              <p className="text-gray-500 text-xs mt-1 font-medium">Manage your restaurant locations and contact details</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search branches..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-11 text-xs font-medium bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-md w-64"
                />
              </div>
              <Button onClick={() => setEditIndex(-1)} className="h-11 px-6 rounded-md gap-2 font-medium shadow-lg shadow-blue-100 bg-blue-600">
                <Plus className="w-4 h-4" />
                Add Branch
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
                    <th className="px-6 py-4 text-xs font-medium text-gray-500">Branch</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500">Contact</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginatedBranches.length > 0 ? (
                      paginatedBranches.map((branch, i) => {
                        const globalIndex = branches.findIndex(b => b === branch);
                        return (
                          <tr 
                            key={branch.branch_name + i}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-xs font-medium text-gray-400 text-center">
                              {(currentPage - 1) * itemsPerPage + i + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                  <Building className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{branch.branch_name}</div>
                                  <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                    <Navigation className="w-2.5 h-2.5" />
                                    {branch.branch_address}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {branch.branch_phone && (
                                  <div className="text-[10px] font-medium text-gray-600 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-blue-400" />
                                    {branch.branch_phone}
                                  </div>
                                )}
                                {branch.branch_email && (
                                  <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5">
                                    <Mail className="w-3 h-3 text-blue-300" />
                                    {branch.branch_email}
                                  </div>
                                )}
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
                              <Building2 className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="text-gray-400 text-sm font-bold">No branches configured</div>
                            <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-md border-gray-200 font-medium">
                              Add your first branch
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
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-medium text-gray-900">
                  {editIndex === -1 ? 'Add New Branch' : 'Edit Branch Details'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Enter the location and contact information for this branch.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Branch Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.branch_name} 
                        onChange={e => setForm({...form, branch_name: e.target.value})}
                        placeholder="e.g. Downtown Outlet"
                        className="pl-10 rounded-md border-gray-200 bg-white h-11 font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.branch_phone} 
                        onChange={e => setForm({...form, branch_phone: e.target.value})}
                        placeholder="+91 98765 43210"
                        className="pl-10 rounded-md border-gray-200 bg-white h-11 font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.branch_email} 
                        onChange={e => setForm({...form, branch_email: e.target.value})}
                        placeholder="downtown@restaurant.com"
                        className="pl-10 rounded-md border-gray-200 bg-white h-11 font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Full Address</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.branch_address} 
                        onChange={e => setForm({...form, branch_address: e.target.value})}
                        placeholder="Street, City, Pincode"
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
                    onClick={() => remove(editIndex)} 
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold gap-2 mr-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Branch
                  </Button>
                )}
                <Button variant="ghost" onClick={cancelEdit} className="font-medium rounded-md h-11 px-6">Cancel</Button>
                <Button onClick={save} className="px-8 font-medium rounded-md h-11 shadow-lg shadow-blue-100 bg-blue-600">
                  {editIndex === -1 ? 'Add Branch' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
