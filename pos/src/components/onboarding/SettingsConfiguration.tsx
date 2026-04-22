import { useState } from 'react';
import { SetupCard, PrimaryButton, FormField, Input, Select } from './Shared';
import { Button } from '../ui/button';
import { 
  Printer, 
  Bed, 
  Layout, 
  CreditCard, 
  GitBranch, 
  Users, 
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Plus,
  Store
} from 'lucide-react';

const settingsModules = [
  { id: 'printer', title: 'Printer Setup', desc: 'Configure your receipt and kitchen printers', icon: Printer, color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'rooms', title: 'URY Rooms', desc: 'Add and manage dining rooms or sections', icon: Bed, color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'tables', title: 'URY Tables', desc: 'Set up your restaurant table layout', icon: Layout, color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'payment', title: 'Mode of Payment', desc: 'Configure the payment methods your restaurant accepts', icon: CreditCard, color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'branch', title: 'Branch', desc: 'Manage your restaurant branches and locations', icon: GitBranch, color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'restaurant', title: 'Restaurant', desc: 'Configure your restaurant profiles', icon: Store, color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'users', title: 'User Management', desc: 'Create staff accounts and assign roles', icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
];

const PrinterSetupContent = () => (
  <div className="space-y-6">
    <FormField label="Printer Name">
      <Input placeholder="e.g. Kitchen Printer 1" />
    </FormField>
    <FormField label="Port" helperText="Default port is 9100 for most thermal printers">
      <Input defaultValue="9100" />
    </FormField>
    <FormField label="Printer Format Name">
      <Select 
        value="Standard Receipt"
        onChange={() => {}}
        options={[{label: 'Standard Receipt', value: 'Standard Receipt'}]}
      />
    </FormField>
    <div className="pt-2">
      <Button className="flex items-center gap-2 rounded-xl text-md px-6 py-6" size="lg">
        <Printer size={20} /> Save Printer
      </Button>
    </div>
  </div>
);

const RoomsSetupContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Main Hall</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Private Dining</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <Input placeholder="Room name..." className="flex-1 w-full" />
      <Button className="flex items-center gap-2 rounded-xl w-full sm:w-auto h-11 px-6">
        <Plus size={18} /> Add Room
      </Button>
    </div>
  </div>
);

const PaymentSetupContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground">Cash</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Default</span>
      </div>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Credit / Debit Card</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <Input placeholder="e.g. UPI, Wallet, Bank Transfer..." className="flex-1 w-full" />
      <Button className="flex items-center gap-2 rounded-xl w-full sm:w-auto h-11 px-6">
        <Plus size={18} /> Add Method
      </Button>
    </div>
  </div>
);

const TablesSetupContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Table 1</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Table 2</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Table 3</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <Input placeholder="Table name..." className="flex-1 w-full" />
      <Button className="flex items-center gap-2 rounded-xl w-full sm:w-auto h-11 px-6 shrink-0">
        <Plus size={18} /> Add Table
      </Button>
    </div>
  </div>
);

const BranchSetupContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Main Branch</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <Input placeholder="Branch name..." className="flex-1 w-full" />
      <Button className="flex items-center gap-2 rounded-xl w-full sm:w-auto h-11 px-6 shrink-0">
        <Plus size={18} /> Add Branch
      </Button>
    </div>
  </div>
);

const RestaurantSetupContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <span className="font-medium text-foreground">Main Restaurant</span>
      <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <Input placeholder="Restaurant name..." className="flex-1 w-full" />
      <Button className="flex items-center gap-2 rounded-xl w-full sm:w-auto h-11 px-6 shrink-0">
        <Plus size={18} /> Add Restaurant
      </Button>
    </div>
  </div>
);

const UsersSetupContent = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">Admin</span>
        <span className="text-sm text-muted-foreground font-normal">Administrator</span>
      </div>
    </div>
    
    <div className="pt-2">
      <h4 className="text-sm font-medium text-foreground mb-3">Create New User</h4>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Username" className="flex-1" />
          <Input placeholder="Password" type="password" className="flex-1" />
        </div>
        <Select value="staff" onChange={() => {}} options={[{label: 'Staff', value: 'staff'}, {label: 'Manager', value: 'manager'}, {label: 'Admin', value: 'admin'}]} />
        <div>
          <Button className="flex items-center gap-2 rounded-xl h-11 px-6 mt-2">
            <Plus size={18} /> Create User
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export const SettingsConfiguration = ({ onFinish, onBack, disabled }: { onFinish: () => void, onBack: () => void, disabled?: boolean }) => {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);

  if (activeSetting) {
    const activeModule = settingsModules.find(m => m.id === activeSetting);
    
    return (
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => setActiveSetting(null)}
          className="text-muted-foreground hover:text-foreground font-normal flex items-center gap-2 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>
        <SetupCard>
          {activeModule && (
            <div className="flex items-start gap-4 mb-8">
              <div className={`${activeModule.bg} ${activeModule.color} p-3 rounded-xl shrink-0`}>
                <activeModule.icon size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">{activeModule.title}</h2>
                <p className="text-muted-foreground mt-1">{activeModule.desc}</p>
              </div>
            </div>
          )}

          {activeSetting === 'printer' && <PrinterSetupContent />}
          {activeSetting === 'rooms' && <RoomsSetupContent />}
          {activeSetting === 'payment' && <PaymentSetupContent />}
          {activeSetting === 'tables' && <TablesSetupContent />}
          {activeSetting === 'branch' && <BranchSetupContent />}
          {activeSetting === 'restaurant' && <RestaurantSetupContent />}
          {activeSetting === 'users' && <UsersSetupContent />}
        </SetupCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SetupCard>
        <div className="space-y-3 mb-10">
          {settingsModules.map((module) => (
            <button 
              key={module.id}
              onClick={() => setActiveSetting(module.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all group text-left"
            >
              <div className={`${module.bg} ${module.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <module.icon size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{module.title}</h4>
                <p className="text-sm text-muted-foreground">{module.desc}</p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground font-normal flex items-center gap-2 transition-colors px-4 py-2 text-sm"
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          <PrimaryButton onClick={onFinish} disabled={disabled} className="px-10">
            {disabled ? 'Finishing...' : 'Finish Setup'} <CheckCircle2 size={18} />
          </PrimaryButton>

        </div>
      </SetupCard>
    </div>
  );
};
