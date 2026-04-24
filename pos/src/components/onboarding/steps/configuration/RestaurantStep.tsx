import React, { useEffect, useState } from 'react';
import { FormField } from '../../shared/FormField';
import { Info, Building2, Image, Loader2, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardingApi } from '../../../../lib/onboarding-api';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../../ui/toast';

interface RestaurantForm {
  restaurant_name: string;
  tagline: string;
  type: string;
  opening_time: string;
  closing_time: string;
}

const emptyRestaurant = (): RestaurantForm => ({
  restaurant_name: '',
  tagline: '',
  type: 'casual_dining',
  opening_time: '09:00',
  closing_time: '23:00',
});

export const RestaurantStep: React.FC = () => {
  const { restaurant: restaurants, updateData } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RestaurantForm>(emptyRestaurant());
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (restaurants.length > 0) return;
      setLoading(true);
      try {
        const response = await onboardingApi.getRestaurantContext();
        if (response && response.restaurant_name) {
          updateData('restaurant', [response]);
        }
      } catch (error) {
        console.warn('Could not fetch restaurant context, starting fresh');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handleChange = (field: keyof RestaurantForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openEdit = (i: number) => {
    setForm({ ...restaurants[i] });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyRestaurant());
    setEditIndex(null);
  };

  const save = () => {
    if (!form.restaurant_name.trim()) {
      showToast.error('Restaurant name is required');
      return;
    }
    const next = [...restaurants];
    if (editIndex !== null) {
      next[editIndex] = form;
      showToast.success('Restaurant updated');
    } else {
      next.push(form);
      showToast.success('Restaurant added');
    }
    updateData('restaurant', next);
    cancelEdit();
  };

  const remove = (i: number) => {
    const next = [...restaurants];
    next.splice(i, 1);
    updateData('restaurant', next);
    showToast.success('Restaurant removed');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Fetching restaurant details...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* List Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Registered Restaurants</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {restaurants.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{r.restaurant_name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {r.type?.replace('_', ' ') || ''}
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
                {editIndex !== null ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h4>
            </div>

            <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Display Name"
                  placeholder="e.g. URY Kitchen"
                  icon={<Building2 className="w-4 h-4" />}
                  value={form.restaurant_name}
                  onChange={(e) => handleChange('restaurant_name', e.target.value)}
                  required
                />
                <FormField
                  label="Tagline"
                  placeholder="e.g. Authentic Taste"
                  icon={<Info className="w-4 h-4" />}
                  value={form.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                />
                <FormField
                  label="Cuisine Type"
                  type="select"
                  options={[
                    { value: 'fine_dining', label: 'Fine Dining' },
                    { value: 'casual_dining', label: 'Casual Dining' },
                    { value: 'fast_food', label: 'Quick Service / Fast Food' },
                    { value: 'cafe', label: 'Cafe / Bakery' },
                  ]}
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Opening Time"
                    type="time"
                    value={form.opening_time}
                    onChange={(e) => handleChange('opening_time', e.target.value)}
                  />
                  <FormField
                    label="Closing Time"
                    type="time"
                    value={form.closing_time}
                    onChange={(e) => handleChange('closing_time', e.target.value)}
                  />
                </div>
              </div>

              {/* Logo Hint */}
              <div className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <Image className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Brand Logo</p>
                    <p className="text-xs text-gray-400 font-bold tracking-widest">PNG, JPG up to 2MB</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="font-bold text-xs uppercase rounded-lg border-2">
                  Upload
                </Button>
              </div>

              <div className="flex gap-3 justify-end">
                {editIndex !== null && (
                  <Button variant="outline" onClick={cancelEdit} className="font-bold gap-2 rounded-xl h-11 px-6">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                )}
                <Button onClick={save} className="font-bold gap-2 rounded-xl h-11 px-8 shadow-lg shadow-blue-100">
                  {editIndex !== null ? (
                    <><Check className="w-4 h-4" /> Update Restaurant</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add Restaurant</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 border border-indigo-200">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Brand Identity</h4>
              <p className="text-xs text-indigo-700 leading-relaxed mt-1">
                Manage multiple restaurant brands under your account. Each can have its own logo, tagline, and operational hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
