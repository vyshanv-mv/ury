import React, { useEffect, useState } from 'react';
import { Printer, Globe, Hash, ReceiptText, Loader2, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { FormField } from '../../shared/FormField';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../../ui/toast';

interface PrinterForm {
  printer_name: string;
  server_ip: string;
  port: string;
  bill: boolean;
}

const emptyPrinter = (): PrinterForm => ({
  printer_name: '',
  server_ip: '',
  port: '9100',
  bill: true,
});

export const PrinterStep: React.FC = () => {
  const { printer: storePrinters, updateData } = useOnboardingStore();
  const printers = Array.isArray(storePrinters) ? storePrinters : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PrinterForm>(emptyPrinter());
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (printers.length > 0) return;
      setLoading(true);
      try {
        const response = await onboardingApi.getPrinterContext();
        if (response && response.printer_name) {
          updateData('printer', [response]);
        }
      } catch (error) {
        console.warn('Could not fetch printer context');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handleChange = (field: keyof PrinterForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openEdit = (i: number) => {
    setForm({ ...printers[i] });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyPrinter());
    setEditIndex(null);
  };

  const save = () => {
    if (!form.printer_name.trim() || !form.server_ip.trim()) {
      showToast.error('Printer name and IP are required');
      return;
    }
    const next = [...printers];
    if (editIndex !== null) {
      next[editIndex] = form;
      showToast.success('Printer updated');
    } else {
      next.push(form);
      showToast.success('Printer added');
    }
    updateData('printer', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...printers];
    next.splice(i, 1);
    updateData('printer', next);
    showToast.success('Printer removed');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Scanning for printers...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* List Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Printer className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Configured Printers</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {printers.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Printer className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{p.printer_name}</p>
                        <p className="text-xs font-medium text-gray-500">
                          {p.server_ip}:{p.port} {p.bill && '• Bill Printer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(i)}
                        className="text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(i)}
                        className="text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                {editIndex !== null ? 'Edit Printer' : 'Add New Printer'}
              </h4>
            </div>

            <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Printer Name"
                  placeholder="e.g. Kitchen 1"
                  icon={<Printer className="w-4 h-4" />}
                  value={form.printer_name}
                  onChange={(e) => handleChange('printer_name', e.target.value)}
                  required
                />
                <FormField
                  label="Server IP"
                  placeholder="192.168.1.100"
                  icon={<Globe className="w-4 h-4" />}
                  value={form.server_ip}
                  onChange={(e) => handleChange('server_ip', e.target.value)}
                  required
                />
                <FormField
                  label="Port"
                  placeholder="9100"
                  icon={<Hash className="w-4 h-4" />}
                  value={form.port}
                  onChange={(e) => handleChange('port', e.target.value)}
                  required
                />

                <div className="flex flex-col space-y-3 p-5 bg-white border border-gray-100 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <ReceiptText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Bill Printing</p>
                        <p className="text-xs text-gray-400">Enable automatic receipt printing</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleChange('bill', !form.bill)}
                      className={`w-12 h-6 p-0 min-w-0 rounded-full transition-all duration-300 relative ${form.bill ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${form.bill ? 'left-7' : 'left-1'
                          }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                {editIndex !== null && (
                  <Button variant="outline" onClick={cancelEdit} className="font-bold gap-2 rounded-xl h-11 px-6">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                )}
                <Button onClick={save} className="font-bold gap-2 rounded-xl h-11 px-8 shadow-lg shadow-blue-100">
                  {editIndex !== null ? (
                    <><Check className="w-4 h-4" /> Update Printer</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add Printer</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Network Printing</h4>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                You can add multiple printers for separate areas like the Kitchen, Bar, and Front Desk. Each printer needs a valid IP address.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
