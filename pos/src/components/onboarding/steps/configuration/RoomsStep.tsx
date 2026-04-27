import React, { useEffect, useState } from 'react';
import { 
  DoorOpen, Plus, Trash2, Search, MoreVertical, Loader2, Users
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardsetupApi } from '../../../../lib/onboardsetup-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Pagination } from '../../../ui/pagination';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from '../../../ui/dialog';

interface RoomForm {
  name: string;
  seats: string;
}

const emptyRoom = (): RoomForm => ({ name: '', seats: '' });

export const RoomsStep: React.FC = () => {
  const { rooms: storeRooms, updateData } = useOnboardingStore();
  const rooms = Array.isArray(storeRooms) ? storeRooms : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RoomForm>(emptyRoom());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (rooms.length > 0) return;
    setLoading(true);
    onboardsetupApi
      .getRoomContext()
      .then((res) => {
        if (res?.rooms?.length > 0) updateData('rooms', res.rooms);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (i: number) => {
    setForm({ name: rooms[i].name, seats: String(rooms[i].seats) });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyRoom());
    setEditIndex(null);
  };

  const save = () => {
    const trimmedName = form.name?.trim();
    const capacity = parseInt(form.seats);
    
    if (!trimmedName || isNaN(capacity)) {
      showToast.error('Room name and capacity are required');
      return;
    }

    // Duplicate check
    const exists = rooms.some((r, idx) => 
      r.name.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
    );
    if (exists) {
      showToast.error('A room with this name already exists');
      return;
    }

    const next = [...rooms];
    const entry = { name: trimmedName, seats: capacity };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Room updated');
    } else {
      next.push(entry);
      showToast.success('Room added');
    }
    updateData('rooms', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...rooms];
    next.splice(i, 1);
    updateData('rooms', next);
    showToast.success('Room removed');
    setEditIndex(null);
  };

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-gray-500">Fetching room details...</p>
        </div>
      ) : (
        <>
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <DoorOpen className="w-7 h-7 text-blue-600" />
                Dining Areas
              </h2>
              <p className="text-gray-500 text-xs mt-1 font-medium">Configure your restaurant sections and their seating capacities</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search areas..." 
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
                Add Area
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Area Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Capacity</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginatedRooms.length > 0 ? (
                      paginatedRooms.map((room, i) => {
                        const globalIndex = rooms.findIndex(r => r === room);
                        return (
                          <tr 
                            key={room.name + i}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-xs font-bold text-gray-400 text-center">
                              {(currentPage - 1) * itemsPerPage + i + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                  <DoorOpen className="w-5 h-5" />
                                </div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {room.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Users className="w-3.5 h-3.5 text-blue-400" />
                                {room.seats} Total Seats
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
                              <DoorOpen className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="text-gray-400 text-sm font-bold">No areas configured</div>
                            <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-md border-gray-200 font-medium">
                              Create first area
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
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <DoorOpen className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {editIndex === -1 ? 'Add New Dining Area' : 'Edit Area Details'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Define the name and seating capacity for this section of your restaurant.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Area Name</label>
                    <div className="relative">
                      <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="e.g. Main Dining Hall"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Total Seats</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type="number"
                        value={form.seats} 
                        onChange={e => setForm({...form, seats: e.target.value})}
                        placeholder="40"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
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
                    Delete Area
                  </Button>
                )}
                <Button variant="ghost" onClick={cancelEdit} className="font-medium rounded-md h-11 px-6">Cancel</Button>
                <Button onClick={save} className="px-8 font-medium rounded-md h-11 shadow-lg shadow-blue-100 bg-blue-600">
                  {editIndex === -1 ? 'Add Area' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
