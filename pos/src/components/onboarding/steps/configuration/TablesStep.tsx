import React, { useEffect, useState } from 'react';
import { 
  Table2, Loader2, Plus, Info, Trash2, MapPin, Pencil, Search, MoreVertical, Users
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

interface TableForm { 
  name: string; 
  seats: string; 
  room: string; 
}

const emptyTable = (defaultRoom = ''): TableForm => ({ 
  name: '', 
  seats: '', 
  room: defaultRoom 
});

export const TablesStep: React.FC = () => {
  const { tables: storeTables, rooms: storeRooms, updateData } = useOnboardingStore();
  const tables = Array.isArray(storeTables) ? storeTables : [];
  const rooms = Array.isArray(storeRooms) ? storeRooms : [];
  const [loading, setLoading] = useState(false);
  const defaultRoom = rooms[0]?.name ?? '';
  const [form, setForm] = useState<TableForm>(emptyTable(defaultRoom));
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!form.room && defaultRoom) setForm(f => ({ ...f, room: defaultRoom }));
    if (tables.length > 0) return;
    setLoading(true);
    onboardsetupApi.getTableContext()
      .then(res => { if (res?.tables?.length > 0) updateData('tables', res.tables); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [rooms, defaultRoom]);

  const openEdit = (i: number) => {
    const t = tables[i];
    setForm({ name: t.name, seats: String(t.seats), room: t.room });
    setEditIndex(i);
  };

  const cancelEdit = () => { 
    setForm(emptyTable(defaultRoom)); 
    setEditIndex(null); 
  };

  const save = () => {
    const trimmedName = form.name?.trim();
    const capacity = parseInt(form.seats);
    
    if (!trimmedName || isNaN(capacity) || !form.room || form.room === 'none') {
      showToast.error('Fill in table name, seats, and select a valid room');
      return;
    }

    // Duplicate check in the same room
    const exists = tables.some((t, idx) => 
      t.name.toLowerCase() === trimmedName.toLowerCase() && 
      t.room === form.room &&
      idx !== editIndex
    );
    if (exists) {
      showToast.error(`Table "${trimmedName}" already exists in ${form.room}`);
      return;
    }

    const next = [...tables];
    const entry = { name: trimmedName, seats: capacity, room: form.room };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Table updated');
    } else {
      next.push(entry);
      showToast.success('Table added');
    }
    updateData('tables', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...tables];
    next.splice(i, 1);
    updateData('tables', next);
    showToast.success('Table removed');
    setEditIndex(null);
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
  const paginatedTables = filteredTables.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-gray-500">Fetching table details...</p>
        </div>
      ) : (
        <>
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Table2 className="w-7 h-7 text-blue-600" />
                Table Layout
              </h2>
              <p className="text-gray-500 text-xs mt-1 font-medium">Assign tables to your dining areas and set their capacity</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search tables..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-11 text-xs font-semibold bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl w-64"
                />
              </div>
              <Button onClick={() => setEditIndex(-1)} className="h-11 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-blue-100 bg-blue-600">
                <Plus className="w-4 h-4" />
                Add Table
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Table Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Area / Room</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Capacity</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode='popLayout'>
                    {paginatedTables.length > 0 ? (
                      paginatedTables.map((table, i) => {
                        const globalIndex = tables.findIndex(t => t === table);
                        return (
                          <motion.tr 
                            key={table.name + i}
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
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                  <Table2 className="w-5 h-5" />
                                </div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {table.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg w-fit">
                                <MapPin className="w-3 h-3" />
                                {table.room}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Users className="w-3.5 h-3.5 text-blue-400" />
                                {table.seats} Seats
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
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                              <Table2 className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="text-gray-400 text-sm font-bold">No tables configured</div>
                            <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-xl border-gray-200 font-bold">
                              Add your first table
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

          {/* Warning for missing rooms */}
          {rooms.length === 0 && (
            <div className="p-4 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4 items-start shadow-sm">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600 border border-amber-200">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Rooms Required</h4>
                <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                  You need to create at least one dining area (room) before you can add tables. Please go back to the <span className="font-bold">URY Rooms</span> step.
                </p>
              </div>
            </div>
          )}

          {/* Form Dialog */}
          <Dialog open={editIndex !== null} onOpenChange={(open) => !open && cancelEdit()}>
            <DialogContent size="lg" onClose={cancelEdit}>
              <DialogHeader className="border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Table2 className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {editIndex === -1 ? 'Add New Table' : 'Edit Table Details'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Set the table identifier, seating capacity, and assign it to a dining area.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Table Name</label>
                    <div className="relative">
                      <Table2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="e.g. T-01"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Capacity (Seats)</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type="number"
                        value={form.seats} 
                        onChange={e => setForm({...form, seats: e.target.value})}
                        placeholder="4"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Dining Area (Room)</label>
                    <Select value={form.room} onValueChange={val => setForm({...form, room: val})} className="h-11 rounded-xl">
                      {rooms.map(r => r.name && <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                      {rooms.length === 0 && <SelectItem value="none" disabled>No Rooms Available</SelectItem>}
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
                    Delete Table
                  </Button>
                )}
                <Button variant="ghost" onClick={cancelEdit} className="font-bold rounded-xl h-11 px-6">Cancel</Button>
                <Button onClick={save} className="px-8 font-bold rounded-xl h-11 shadow-lg shadow-blue-100 bg-blue-600">
                  {editIndex === -1 ? 'Add Table' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
