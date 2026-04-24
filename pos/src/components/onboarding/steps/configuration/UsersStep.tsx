import React, { useEffect, useState } from 'react';
import { 
  Loader2, UserPlus, Search, MoreVertical, 
  Users as UsersIcon, Trash2
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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

interface UserData {
  name: string;
  role: string;
}

const emptyForm = (): UserData => ({ 
  name: '', 
  role: 'Cashier'
});

export const UsersStep: React.FC = () => {
  const { users: storeUsers, updateData } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UserData>(emptyForm());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const users: UserData[] = Array.isArray(storeUsers) ? storeUsers : [];

  useEffect(() => {
    if (storeUsers?.length > 0) return;
    setLoading(true);
    onboardsetupApi.getUserManagementContext()
      .then(res => { 
        if (res?.existing_users?.length > 0) {
          updateData('users', res.existing_users); 
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (i: number) => { setForm({ ...users[i] }); setEditIndex(i); };
  const cancelEdit = () => { setForm(emptyForm()); setEditIndex(null); };

  const save = () => {
    try {
      const trimmedName = form.name?.trim();
      if (!trimmedName) { 
        showToast.error('Enter the user name'); 
        return; 
      }
      
      // Check for existing user (case-insensitive)
      const currentUsers = Array.isArray(storeUsers) ? storeUsers : [];
      const exists = currentUsers.some((u, idx) => 
        u?.name?.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
      );
      
      if (exists) {
        showToast.error('User with this name already exists');
        return;
      }

      const next = [...currentUsers];
      const entry = { name: trimmedName, role: form.role || 'Cashier' };
      
      if (editIndex !== null && editIndex !== -1 && editIndex < next.length) { 
        next[editIndex] = entry; 
        showToast.success('User updated'); 
      } else { 
        next.push(entry); 
        showToast.success('User added'); 
      }
      
      updateData('users', next);
      cancelEdit();
    } catch (err) {
      console.error('Error saving user:', err);
      showToast.error('Failed to save user');
    }
  };

  const remove = (i: number) => {
    const currentUsers = Array.isArray(storeUsers) ? storeUsers : [];
    if (i < 0 || i >= currentUsers.length) return;
    
    const next = [...currentUsers]; 
    next.splice(i, 1); 
    updateData('users', next);
    showToast.success('User removed');
    setEditIndex(null);
  };

  const filteredUsers = users.filter(u => 
    u && (
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-gray-500">Fetching team members...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="w-7 h-7 text-blue-600" />
            Team Management
          </h2>
          <p className="text-gray-500 text-xs mt-1 font-medium">Add and manage your staff members and their roles</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Search team..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-11 text-xs font-semibold bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl w-64"
            />
          </div>
          <Button onClick={() => setEditIndex(-1)} className="h-11 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-blue-100 bg-blue-600">
            <UserPlus className="w-4 h-4" />
            Add Member
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode='popLayout'>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user, i) => {
                    const globalIndex = users.findIndex(u => u === user);
                    return (
                      <motion.tr 
                        key={user.name + i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-gray-400 text-center">
                          {(currentPage - 1) * itemsPerPage + i + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium">Active Member</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                            user.role === 'Administrator' ? 'bg-purple-50 text-purple-600' :
                            user.role === 'Manager' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
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
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="text-gray-400 text-sm font-bold">No team members found</div>
                        <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-xl border-gray-200 font-bold">
                          Add your first member
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
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
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {editIndex === -1 ? 'Add New Member' : 'Edit Team Member'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Fill in the details below to {editIndex === -1 ? 'add a new staff member' : 'update this team member'}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                <Input 
                  id="name"
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Role</label>
                <Select value={form.role} onValueChange={val => setForm({...form, role: val})} className="h-11 rounded-xl">
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Waiter">Waiter</SelectItem>
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
                Delete Member
              </Button>
            )}
            <Button variant="ghost" onClick={cancelEdit} className="font-bold rounded-xl h-11 px-6">Cancel</Button>
            <Button onClick={save} className="px-8 font-bold rounded-xl h-11 shadow-lg shadow-blue-100 bg-blue-600">
              {editIndex === -1 ? 'Add Member' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

