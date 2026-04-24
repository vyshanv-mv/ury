import React, { useState } from 'react';
import { Share2, Check, Loader2, Plus, ExternalLink, Shield, Info, Power, Settings2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { showToast } from '../../../ui/toast';
import { cn } from '../../../../lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  category: 'Aggregator' | 'Payment' | 'Accounting';
  status: 'Available' | 'Connected' | 'Pending';
  color: string;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'swiggy',
    name: 'Swiggy',
    description: 'Sync menu and receive orders directly from Swiggy.',
    category: 'Aggregator',
    status: 'Available',
    color: 'bg-[#fc8019]'
  },
  {
    id: 'zomato',
    name: 'Zomato',
    description: 'Manage Zomato orders and menu updates seamlessly.',
    category: 'Aggregator',
    status: 'Available',
    color: 'bg-[#cb202d]'
  },
  {
    id: 'magicpin',
    name: 'Magicpin',
    description: 'Connect with Magicpin for hyperlocal discovery and rewards.',
    category: 'Aggregator',
    status: 'Available',
    color: 'bg-[#ff0000]'
  },
  {
    id: 'dunzo',
    name: 'Dunzo',
    description: 'Enable Dunzo for fast delivery of your orders.',
    category: 'Aggregator',
    status: 'Available',
    color: 'bg-[#00d290]'
  }
];

export const IntegrationsStep: React.FC = () => {
  const { integrations: storeIntegrations, updateData } = useOnboardingStore();
  const integrations = Array.isArray(storeIntegrations) ? storeIntegrations : [];
  const [loading, setLoading] = useState<string | null>(null);

  const toggleConnection = async (integration: Integration) => {
    setLoading(integration.id);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isConnected = integrations.some(i => i.id === integration.id);
      let next;
      
      if (isConnected) {
        next = integrations.filter(i => i.id !== integration.id);
        showToast.success(`${integration.name} disconnected`);
      } else {
        next = [...integrations, { ...integration, status: 'Connected', connectedAt: new Date().toISOString() }];
        showToast.success(`${integration.name} connected successfully!`);
      }
      
      updateData('integrations', next);
    } catch (error) {
      showToast.error('Connection failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_INTEGRATIONS.map((item) => {
            const isConnected = integrations.some(i => i.id === item.id);
            const isPending = loading === item.id;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className={cn(
                  "relative overflow-hidden p-6 rounded-3xl border-2 transition-all duration-300",
                  isConnected 
                    ? "bg-white border-blue-500 shadow-xl shadow-blue-50" 
                    : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
                )}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isConnected ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      <Check className="w-3 h-3" />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                      Available
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-5">
                  {/* Logo Placeholder */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg",
                    item.color
                  )}>
                    {item.name[0]}
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <h3 className="text-xl font-black text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => toggleConnection(item)}
                        disabled={!!loading}
                        variant={isConnected ? "outline" : "default"}
                        className={cn(
                          "h-10 px-6 rounded-xl font-bold transition-all gap-2",
                          isConnected 
                            ? "border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100" 
                            : "shadow-lg shadow-gray-200"
                        )}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isConnected ? (
                          <>
                            <Power className="w-4 h-4" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Connect
                          </>
                        )}
                      </Button>
                      
                      {isConnected && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer decorations */}
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>Official Integration</span>
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                    Documentation
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-indigo-50/50 rounded-[2rem] p-8 border border-indigo-100 flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-inner">
            <Share2 className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-black text-indigo-900 mb-2">Unified Dashboard Sync</h4>
            <p className="text-sm font-medium text-indigo-700/70 leading-relaxed">
              When you connect an aggregator, orders will automatically appear in your POS Live View. 
              Stock levels and menu changes are synced in real-time across all platforms.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-white/50 backdrop-blur-sm border border-indigo-200 px-5 py-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Setup Status</span>
              </div>
              <p className="text-xs font-bold text-indigo-900">
                {integrations.length} of {AVAILABLE_INTEGRATIONS.length} active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
