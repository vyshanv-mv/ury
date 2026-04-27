import React, { useEffect, useState } from 'react';
import { 
  Image, Loader2, Plus, Trash2, Search, MoreVertical, 
  Clock, Utensils, Info, Building
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { useOnboardingStore } from '../../../../store/onboarding-store';
import { onboardsetupApi } from '../../../../lib/onboardsetup-api';
import { showToast } from '../../../ui/toast';
import { Input } from '../../../ui/input';
import { Pagination } from '../../../ui/pagination';
import { Select, SelectItem } from '../../../ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from '../../../ui/dialog';

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
  const { restaurant: storeRestaurants, updateData } = useOnboardingStore();
  const restaurants = Array.isArray(storeRestaurants) ? storeRestaurants : [];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RestaurantForm>(emptyRestaurant());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchContext = async () => {
      if (restaurants.length > 0) return;
      setLoading(true);
      try {
        const response = await onboardsetupApi.getRestaurantContext();
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

  const openEdit = (i: number) => {
    setForm({ ...restaurants[i] });
    setEditIndex(i);
  };

  const cancelEdit = () => {
    setForm(emptyRestaurant());
    setEditIndex(null);
  };

  const save = () => {
    const trimmedName = form.restaurant_name?.trim();
    if (!trimmedName) {
      showToast.error('Restaurant name is required');
      return;
    }

    // Duplicate check
    const exists = restaurants.some((r, idx) => 
      r.restaurant_name.toLowerCase() === trimmedName.toLowerCase() && idx !== editIndex
    );
    if (exists) {
      showToast.error('A restaurant with this name already exists');
      return;
    }

    const next = [...restaurants];
    const entry = { ...form, restaurant_name: trimmedName };
    
    if (editIndex !== null && editIndex !== -1) {
      next[editIndex] = entry;
      showToast.success('Restaurant updated');
    } else {
      next.push(entry);
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
    setEditIndex(null);
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Fetching restaurant details...</p>
        </div>
      ) : (
        <>
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-md border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                <Utensils className="w-7 h-7 text-blue-600" />
                Restaurants
              </h2>
              <p className="text-gray-500 text-xs mt-1 font-medium">Manage your restaurant brands and their identities</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search restaurants..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-11 text-xs font-medium bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-md w-64"
                />
              </div>
              <Button onClick={() => setEditIndex(-1)} className="h-11 px-6 rounded-md gap-2 font-medium shadow-lg shadow-blue-100 bg-blue-600">
                <Plus className="w-4 h-4" />
                Add Restaurant
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 w-12 text-center">#</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500">Restaurant</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500">Details</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginatedRestaurants.length > 0 ? (
                      paginatedRestaurants.map((restaurant, i) => {
                        const globalIndex = restaurants.findIndex(r => r === restaurant);
                        return (
                          <tr 
                            key={restaurant.restaurant_name + i}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-xs font-medium text-gray-400 text-center">
                              {(currentPage - 1) * itemsPerPage + i + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  <Building className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{restaurant.restaurant_name}</div>
                                  <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                    <Info className="w-2.5 h-2.5" />
                                    {restaurant.tagline || 'No tagline set'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                    {restaurant.type?.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-blue-400" />
                                  {restaurant.opening_time} - {restaurant.closing_time}
                                </div>
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
                              <Utensils className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="text-gray-400 text-sm font-bold">No restaurants configured</div>
                            <Button variant="outline" onClick={() => setEditIndex(-1)} size="sm" className="mt-2 rounded-md border-gray-200 font-medium">
                              Add your first restaurant
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
                <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center mb-4">
                  <Utensils className="w-6 h-6 text-blue-600" />
                </div>
                <DialogTitle className="text-lg font-medium text-gray-900">
                  {editIndex === -1 ? 'Add New Restaurant' : 'Edit Restaurant Details'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Define your restaurant brand, cuisine type, and operational hours.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Restaurant Name</label>
                    <Input 
                      value={form.restaurant_name} 
                      onChange={e => setForm({...form, restaurant_name: e.target.value})}
                      placeholder="e.g. URY Kitchen"
                      className="rounded-md border-gray-200 bg-white h-11 font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Tagline</label>
                    <Input 
                      value={form.tagline} 
                      onChange={e => setForm({...form, tagline: e.target.value})}
                      placeholder="e.g. Authentic Taste"
                      className="rounded-md border-gray-200 bg-white h-11 font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 ml-1">Cuisine Type</label>
                    <Select value={form.type} onValueChange={val => setForm({...form, type: val})} className="h-11 rounded-md">
                      <SelectItem value="fine_dining">Fine Dining</SelectItem>
                      <SelectItem value="casual_dining">Casual Dining</SelectItem>
                      <SelectItem value="fast_food">Fast Food</SelectItem>
                      <SelectItem value="cafe">Cafe / Bakery</SelectItem>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 ml-1">Opening</label>
                      <Input 
                        type="time"
                        value={form.opening_time} 
                        onChange={e => setForm({...form, opening_time: e.target.value})}
                        className="rounded-md border-gray-200 bg-white h-11 font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 ml-1">Closing</label>
                      <Input 
                        type="time"
                        value={form.closing_time} 
                        onChange={e => setForm({...form, closing_time: e.target.value})}
                        className="rounded-md border-gray-200 bg-white h-11 font-medium" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-gray-400 shadow-sm">
                      <Image className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">Brand Logo</p>
                      <p className="text-[10px] text-gray-400 font-medium">PNG or JPG up to 2MB</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-md border-gray-200 font-medium text-xs">
                    Upload
                  </Button>
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
                    Delete Restaurant
                  </Button>
                )}
                <Button variant="ghost" onClick={cancelEdit} className="font-medium rounded-md h-11 px-6">Cancel</Button>
                <Button onClick={save} className="px-8 font-medium rounded-md h-11 shadow-lg shadow-blue-100 bg-blue-600">
                  {editIndex === -1 ? 'Add Restaurant' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
