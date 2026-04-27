import React, { useEffect, useState } from 'react';
import { 
  Printer, Globe, Hash, ReceiptText, Loader2, Plus, Trash2, 
  Search, MoreVertical 
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchContext = async () => {
      if (printers.length > 0) return;
      setLoading(true);
      try {
        const response = await onboardsetupApi.getPrinterContext();
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

  const handleChange = <K extends keyof PrinterForm>(field: K, value: PrinterForm[K]) => {
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
    const trimmedName = form.printer_name?.trim();
    const trimmedIp = form.server_ip?.trim();

    if (!trimmedName || !trimmedIp) {
      showToast.error('Printer name and IP are required');
      return;
    }

    // Duplicate check
    const exists = printers.some((p, idx) => 
      p.printer_name.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
    );
    if (exists) {
      showToast.error('A printer with this name already exists');
      return;
    }

    const next = [...printers];
    const entry = { ...form, printer_name: trimmedName, server_ip: trimmedIp };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Printer updated');
    } else {
      next.push(entry);
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
    setEditIndex(null);
  };

  const filteredPrinters = printers.filter(p => 
    p.printer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.server_ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPrinters.length / itemsPerPage);
  const paginatedPrinters = filteredPrinters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-gray-500">Scanning for printers...</p>
        </div>
      ) : (
        <>
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Printer className="w-7 h-7 text-blue-600" />
                Network Printers
              </h2>
              <p className="text-gray-500 text-xs mt-1 font-medium">Manage POS and Kitchen Order Ticket (KOT) printers</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search printers..." 
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
                Add Printer
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Printer Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Network Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginatedPrinters.length > 0 ? (
                      paginatedPrinters.map((p, i) => {
                        const globalIndex = printers.findIndex(item => item === p);
                        return (
                          <tr 
                            key={p.printer_name + i}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-xs font-bold text-gray-400 text-center">
                              {(currentPage - 1) * itemsPerPage + i + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                  <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {p.printer_name}
                                  </div>
                                  {p.bill && (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                                      <ReceiptText className="w-3 h-3" />
                                      Bill Printer
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                  <Globe className="w-3 h-3 text-gray-400" />
                                  {p.server_ip}
                                </div>
                                <div className="text-[10px] font-medium text-gray-400 ml-4.5">
                                  Port: {p.port}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Ready
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
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                              <Printer className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="text-gray-400 text-sm font-bold">No printers configured</div>
                            <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-md border-gray-200 font-medium">
                              Add new printer
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

          {/* Help Info */}
          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4 items-center shadow-sm">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600 shadow-sm border border-amber-100">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Printer Connectivity</h4>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                Ensure your printers are on the same local network. The standard port for thermal printers is <b>9100</b>. You can test connections in the advanced settings later.
              </p>
            </div>
          </div>

          {/* Form Dialog */}
          <Dialog open={editIndex !== null} onOpenChange={(open) => !open && cancelEdit()}>
            <DialogContent size="lg" onClose={cancelEdit}>
              <DialogHeader className="border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Printer className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {editIndex === -1 ? 'Add New Printer' : 'Edit Printer'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Configure network details for your thermal printer.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Printer Name</label>
                    <div className="relative">
                      <Printer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.printer_name} 
                        onChange={e => handleChange('printer_name', e.target.value)}
                        placeholder="e.g. Kitchen Printer"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">IP Address</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.server_ip} 
                        onChange={e => handleChange('server_ip', e.target.value)}
                        placeholder="192.168.1.100"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Port</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.port} 
                        onChange={e => handleChange('port', e.target.value)}
                        placeholder="9100"
                        className="pl-10 rounded-xl border-gray-200 bg-white h-11 font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Print Type</label>
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-gray-700">Bill Printer</span>
                      </div>
                      <button 
                        onClick={() => handleChange('bill', !form.bill)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${form.bill ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${form.bill ? 'left-6' : 'left-1'}`} />
                      </button>
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
                    Remove Printer
                  </Button>
                )}
                <Button variant="ghost" onClick={cancelEdit} className="font-medium rounded-md h-11 px-6">Cancel</Button>
                <Button onClick={save} className="px-8 font-medium rounded-md h-11 shadow-lg shadow-blue-100 bg-blue-600">
                  {editIndex === -1 ? 'Add Printer' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
