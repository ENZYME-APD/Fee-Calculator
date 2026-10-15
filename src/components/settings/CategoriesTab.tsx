"use client";
import React, { useState, useEffect } from 'react';
import { Company, TeamCategory } from '@/lib/firebase/schema';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/lib/firebase/db';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

import { DEFAULT_CATEGORY_HEX } from '@/lib/theme';
export function CategoriesTab({ company }: { company: Company }) {
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{name: string, order: number, color: string, type: 'internal' | 'external'}>({ name: '', order: 10, color: DEFAULT_CATEGORY_HEX, type: 'internal' });

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
      
      setFormData({ name: '', order: categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 10 : 10, color: DEFAULT_CATEGORY_HEX, type: 'internal' });
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

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteCategory(confirmDeleteId);
    await loadCategories();
    setConfirmDeleteId(null);
  };

  const startEditing = (category: TeamCategory) => {
    setFormData({ name: category.name, order: category.order, color: category.color || DEFAULT_CATEGORY_HEX, type: category.type || 'internal' });
    setEditingId(category.id!);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start sm:items-center justify-between">
        <div className="flex-1 pr-4">
          <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50">Team categories</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm mt-1">Organise the Team sorting order in folders and fee proposal cards, color in the graph, allow to set internal and external.</p>
          <div className="mt-4 p-4 bg-accent-50/50 dark:bg-accent-900/20 border border-accent-100 dark:border-accent-900/50 rounded-xl">
            <p className="text-accent-800 dark:text-accent-300 text-sm">
              <span className="font-semibold">Note:</span> Only <em>Internal</em> categories count for the monthly cashflow calculation.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ name: '', order: categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 10 : 10, color: DEFAULT_CATEGORY_HEX, type: 'internal' });
          }}
          className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap shrink-0"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="space-y-3">
        {isAdding && (
          <form onSubmit={handleAdd} className="flex items-center gap-4 p-4 bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-900/30 rounded-xl">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-ink-500 mb-1">Category name</label>
              <input
                type="text"
                placeholder="e.g. MANAGEMENT"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 outline-none"
                autoFocus
                required
              />
            </div>
            <div className="shrink-0">
              <label className="block text-xs font-semibold text-ink-500 mb-1">Color</label>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-ink-200 dark:border-ink-700 relative">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="absolute inset-[-25%] w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-xs font-semibold text-ink-500 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'internal' | 'external' })}
                className="w-full px-3 py-2 rounded-lg border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 outline-none"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-ink-500 mb-1">Sort order</label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 outline-none"
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <button type="submit" disabled={isSaving} className="p-2 text-accent-600 bg-accent-100 dark:bg-accent-900/50 hover:bg-accent-200 dark:hover:bg-accent-900 rounded-lg transition-colors disabled:opacity-50">
                <Check size={18} />
              </button>
              <button type="button" disabled={isSaving} onClick={() => setIsAdding(false)} className="p-2 text-ink-500 bg-ink-200 dark:bg-ink-800 hover:bg-ink-300 dark:hover:bg-ink-700 rounded-lg transition-colors disabled:opacity-50">
                <X size={18} />
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-8 text-center text-ink-500">Loading categories...</div>
        ) : categories.length === 0 && !isAdding ? (
          <div className="py-8 text-center text-ink-500 bg-ink-50 dark:bg-ink-800/50 rounded-xl border border-ink-200 dark:border-ink-800">
            No categories defined yet. Add one to organize your team.
          </div>
        ) : (
          categories.map((category, index) => {
            const isFirstFixed = category.isFixed && (index === 0 || !categories[index - 1].isFixed);
            
            return (
            <React.Fragment key={category.id}>
              {isFirstFixed && (
                <div className="pt-6 pb-2 border-t border-ink-100 dark:border-ink-800/50 mt-4">
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">System categories</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">These categories are required by the system. You can change their color and name.</p>
                </div>
              )}
            <div className="group flex items-center justify-between p-4 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl hover:border-accent-300 dark:hover:border-accent-800 transition-colors">
              {editingId === category.id ? (
                <form onSubmit={(e) => handleUpdate(category.id!, e)} className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 outline-none"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="shrink-0">
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Color</label>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-ink-200 dark:border-ink-700 relative">
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
                      <label className="block text-xs font-semibold text-ink-500 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as 'internal' | 'external' })}
                        className="w-full px-3 py-1.5 rounded-lg border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 outline-none"
                      >
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>
                  )}
                  {!category.isFixed && (
                    <div className="w-24">
                      <label className="block text-xs font-semibold text-ink-500 mb-1">Sort</label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 outline-none"
                        required
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-4">
                    <button type="submit" disabled={isSaving} className="p-2 text-positive-600 bg-positive-50 dark:bg-positive-900/30 hover:bg-positive-100 dark:hover:bg-positive-900/50 rounded-lg transition-colors disabled:opacity-50">
                      <Check size={18} />
                    </button>
                    <button type="button" disabled={isSaving} onClick={() => setEditingId(null)} className="p-2 text-ink-500 bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700 rounded-lg transition-colors disabled:opacity-50">
                      <X size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg text-ink-500 ${category.isFixed ? 'opacity-30 cursor-not-allowed' : 'bg-ink-100 dark:bg-ink-800'}`}>
                      <GripVertical size={18} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm border border-ink-200 dark:border-ink-700" style={{ backgroundColor: category.color || DEFAULT_CATEGORY_HEX }}></div>
                      <div>
                        <h3 className="font-semibold text-ink-900 dark:text-ink-50 flex items-center">
                          {category.name}
                          {category.isFixed && <span className="ml-2 text-xs font-normal bg-ink-100 dark:bg-ink-800 text-ink-500 px-1.5 py-0.5 rounded">Fixed</span>}
                          {category.type === 'external' && !category.isFixed && <span className="ml-2 text-xs font-normal bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 px-1.5 py-0.5 rounded border border-warning-200 dark:border-warning-800/50">External</span>}
                        </h3>
                        {!category.isFixed && <p className="text-xs text-ink-500 font-medium">Sort order: {category.order}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Edit Category" position="top">
                      <button
                        onClick={() => startEditing(category)}
                        className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/50 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </Tooltip>
                    {!category.isFixed && (
                      <Tooltip content="Delete Category" position="top">
                        <button
                          onClick={() => handleDelete(category.id!)}
                          className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-negative-600 dark:hover:text-negative-400 rounded-lg hover:bg-negative-50 dark:hover:bg-negative-900/50 transition-colors"
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
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Category"
        message="Are you sure you want to delete this category? Team members with this category will show as uncategorized until updated."
        confirmText="Delete Category"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
