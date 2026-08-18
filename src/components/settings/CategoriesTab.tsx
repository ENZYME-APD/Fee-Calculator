"use client";
import React, { useState, useEffect } from 'react';
import { Company, TeamCategory } from '@/lib/firebase/schema';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/lib/firebase/db';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export function CategoriesTab({ company }: { company: Company }) {
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<{name: string, order: number, color: string, type: 'internal' | 'external'}>({ name: '', order: 10, color: '#3b82f6', type: 'internal' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await getCategories();
    // Sort by type (internal first), then by order, putting fixed categories at the end
    setCategories(data.sort((a, b) => {
      if (a.isFixed && !b.isFixed) return 1;
      if (!a.isFixed && b.isFixed) return -1;
      
      const typeA = a.type || 'internal';
      const typeB = b.type || 'internal';
      if (typeA !== typeB) {
        return typeA === 'internal' ? -1 : 1;
      }
      return a.order - b.order;
    }));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await addCategory({
        name: formData.name.trim().toUpperCase(),
        order: Number(formData.order),
        color: formData.color,
        type: formData.type
      });
      
      setFormData({ name: '', order: categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 10 : 10, color: '#3b82f6', type: 'internal' });
      setIsAdding(false);
      await loadCategories();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await updateCategory(id, {
        name: formData.name.trim().toUpperCase(),
        order: Number(formData.order),
        color: formData.color,
        type: formData.type
      });
      
      setEditingId(null);
      await loadCategories();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Team members with this category will show as uncategorized until updated.')) return;
    await deleteCategory(id);
    await loadCategories();
  };

  const startEditing = (category: TeamCategory) => {
    setFormData({ name: category.name, order: category.order, color: category.color || '#3b82f6', type: category.type || 'internal' });
    setEditingId(category.id!);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start sm:items-center justify-between">
        <div className="flex-1 pr-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team Categories</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Organise the Team sorting order in folders and fee proposal cards, color in the graph, allow to set internal and external.</p>
          <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              <span className="font-semibold">Note:</span> Only <em>Internal</em> categories count for the monthly cashflow calculation.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ name: '', order: categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 10 : 10, color: '#3b82f6', type: 'internal' });
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap shrink-0"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="space-y-3">
        {isAdding && (
          <form onSubmit={handleAdd} className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category Name</label>
              <input
                type="text"
                placeholder="e.g. MANAGEMENT"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none uppercase"
                autoFocus
                required
              />
            </div>
            <div className="shrink-0">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Color</label>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="absolute inset-[-25%] w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'internal' | 'external' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sort Order</label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <button type="submit" disabled={isSaving} className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50">
                <Check size={18} />
              </button>
              <button type="button" disabled={isSaving} onClick={() => setIsAdding(false)} className="p-2 text-slate-500 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50">
                <X size={18} />
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading categories...</div>
        ) : categories.length === 0 && !isAdding ? (
          <div className="py-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            No categories defined yet. Add one to organize your team.
          </div>
        ) : (
          categories.map((category, index) => {
            const isFirstFixed = category.isFixed && (index === 0 || !categories[index - 1].isFixed);
            
            return (
            <React.Fragment key={category.id}>
              {isFirstFixed && (
                <div className="pt-6 pb-2 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">System Categories</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">These categories are required by the system. You can change their color and name.</p>
                </div>
              )}
            <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
              {editingId === category.id ? (
                <form onSubmit={(e) => handleUpdate(category.id!, e)} className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none uppercase"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="shrink-0">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Color</label>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="absolute inset-[-25%] w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  {!category.isFixed && (
                    <div className="w-28 shrink-0">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as 'internal' | 'external' })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                      >
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>
                  )}
                  {!category.isFixed && (
                    <div className="w-24">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Sort</label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                        required
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-4">
                    <button type="submit" disabled={isSaving} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors disabled:opacity-50">
                      <Check size={18} />
                    </button>
                    <button type="button" disabled={isSaving} onClick={() => setEditingId(null)} className="p-2 text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50">
                      <X size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg text-slate-400 ${category.isFixed ? 'opacity-30 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <GripVertical size={18} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm border border-slate-200 dark:border-slate-700" style={{ backgroundColor: category.color || '#3b82f6' }}></div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white uppercase flex items-center">
                          {category.name}
                          {category.isFixed && <span className="ml-2 text-[10px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">Fixed</span>}
                          {category.type === 'external' && !category.isFixed && <span className="ml-2 text-[10px] font-normal bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded uppercase border border-orange-200 dark:border-orange-800/50">External</span>}
                        </h3>
                        {!category.isFixed && <p className="text-xs text-slate-500 font-medium">Sort Order: {category.order}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Edit Category" position="top">
                      <button
                        onClick={() => startEditing(category)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </Tooltip>
                    {!category.isFixed && (
                      <Tooltip content="Delete Category" position="top">
                        <button
                          onClick={() => handleDelete(category.id!)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </>
              )}
            </div>
            </React.Fragment>
          )})
        )}
      </div>
    </div>
  );
}
