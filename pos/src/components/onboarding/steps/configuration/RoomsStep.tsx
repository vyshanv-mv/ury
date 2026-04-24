import React, { useEffect, useState } from 'react';
import { Check, Loader2, DoorOpen, Plus, Trash2, Info, Pencil, X, Search } from 'lucide-react';
import { Button } from '../../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Pagination } from '../../../ui/pagination';

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
  const itemsPerPage = 4;

  useEffect(() => {
    if (rooms.length > 0) return;
    setLoading(true);
    onboardingApi
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
    if (!form.name.trim() || !form.seats) {
      showToast.error('Fill in both name and capacity');
      return;
    }
    const next = [...rooms];
    const entry = { name: form.name.trim(), seats: parseInt(form.seats) };
    if (editIndex !== null) {
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
  };

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading)
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Fetching room data...</p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Existing Rooms List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                <DoorOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Configured Rooms</h4>
            </div>

            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search rooms..." 
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
              {paginatedRooms.map((room) => {
                const realIndex = rooms.indexOf(room);
                return (
                  <motion.div
                    key={`${room.name}-${realIndex}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                        <DoorOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{room.name}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          {room.seats} Seats
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(realIndex)}
                        className="text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(realIndex)}
                        className="text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredRooms.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-secondary/5 rounded-[2rem] border border-dashed border-border">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-foreground">No rooms found</h5>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search term or add a new room below.</p>
              </div>
            )}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Add / Edit form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <Plus className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              {editIndex !== null ? 'Edit Room' : 'Add New Room'}
            </h4>
          </div>

          <div className="p-6 bg-secondary/10 rounded-2xl border border-border/50 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">
                Room Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className="w-full text-sm font-semibold h-11 shadow-sm"
                placeholder="e.g. Main Hall"
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">
                Seats
              </label>
              <Input
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                type="number"
                min="1"
                className="w-full text-sm font-semibold h-11 shadow-sm"
                placeholder="40"
              />
            </div>
            <div className="flex gap-2">
              {editIndex !== null && (
                <Button variant="outline" size="lg" onClick={cancelEdit} className="font-bold gap-2 flex-1">
                  <X className="w-4 h-4" /> Cancel
                </Button>
              )}
              <Button
                size="lg"
                onClick={save}
                className="font-bold gap-2 flex-1 w-full sm:w-auto"
              >
                {editIndex !== null ? (
                  <>
                    <Check className="w-5 h-5" /> Update
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" /> Add Room
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900">Define Areas</h4>
            <p className="text-xs text-indigo-700/80 leading-relaxed mt-1">
              Rooms categorize your service zones (e.g. Indoor, Rooftop, Terrace). Each area can have its
              own table layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
