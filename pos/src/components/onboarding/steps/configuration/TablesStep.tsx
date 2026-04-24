import React, { useEffect, useState } from 'react';
import { Table2, Loader2, Plus, Info, Trash2, MapPin, Pencil, X, Check } from 'lucide-react';
import { Button } from '../../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Select, SelectItem } from '../../../ui/select';

interface TableForm { name: string; seats: string; room: string; }
const emptyTable = (defaultRoom = ''): TableForm => ({ name: '', seats: '', room: defaultRoom });

export const TablesStep: React.FC = () => {
  const { tables, rooms, updateData } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const defaultRoom = rooms[0]?.name ?? '';
  const [form, setForm] = useState<TableForm>(emptyTable(defaultRoom));
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!form.room && defaultRoom) setForm(f => ({ ...f, room: defaultRoom }));
    if (tables.length > 0) return;
    setLoading(true);
    onboardingApi.getTableContext()
      .then(res => { if (res?.tables?.length > 0) updateData('tables', res.tables); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [rooms]);

  const openEdit = (i: number) => {
    const t = tables[i];
    setForm({ name: t.name, seats: String(t.seats), room: t.room });
    setEditIndex(i);
  };
  const cancelEdit = () => { setForm(emptyTable(defaultRoom)); setEditIndex(null); };

  const save = () => {
    if (!form.name.trim() || !form.seats || !form.room || form.room === 'none') {
      showToast.error('Fill in table name, seats, and select a valid room'); return;
    }
    const next = [...tables];
    const entry = { name: form.name.trim(), seats: parseInt(form.seats), room: form.room };
    if (editIndex !== null) { next[editIndex] = entry; showToast.success('Table updated'); }
    else { next.push(entry); showToast.success('Table added'); }
    updateData('tables', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...tables]; next.splice(i, 1); updateData('tables', next);
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Fetching table data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Table cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {tables.map((table, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all text-center group relative"
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-3 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors mx-auto">
                <Table2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-foreground">{table.name}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{table.seats} Seats</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-primary/70 font-bold">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-20">{table.room}</span>
              </div>
              {/* Hover actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <Button variant="ghost" size="icon" onClick={() => openEdit(i)} className="text-primary hover:bg-primary/10 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add / Edit form */}
      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50 flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Table Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
            placeholder="e.g. T-01"
          />
        </div>
        <div className="w-full lg:w-48">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Room / Area</label>
          <Select
            value={form.room}
            onValueChange={(val) => setForm({ ...form, room: val })}
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
          >
            {rooms.map(r => r.name && <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
            {rooms.length === 0 && <SelectItem value="none" disabled>No Rooms Created</SelectItem>}
          </Select>
        </div>
        <div className="w-full lg:w-32">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block opacity-60">Capacity</label>
          <Input
            value={form.seats}
            onChange={(e) => setForm({ ...form, seats: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            type="number" min="1"
            className="w-full px-5 py-3.5 h-auto bg-card border border-border rounded-xl outline-none focus:border-primary focus:ring-0 transition-all text-sm font-semibold shadow-sm"
            placeholder="4"
          />
        </div>
        <div className="flex gap-2">
          {editIndex !== null && (
            <Button variant="outline" size="lg" onClick={cancelEdit} className="font-bold gap-2 flex-1">
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
          <Button size="lg" onClick={save} className="font-bold gap-2 flex-1 w-full lg:w-auto">
            {editIndex !== null ? <><Check className="w-5 h-5" /> Update</> : <><Plus className="w-5 h-5" /> Add Table</>}
          </Button>
        </div>
      </div>

      {!rooms.length && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            No rooms defined yet. Go back to <span className="font-bold">URY Rooms</span> to create areas before adding tables.
          </p>
        </div>
      )}
    </div>
  );
};
