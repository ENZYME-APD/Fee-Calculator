"use client";
import React, { useState, useEffect } from 'react';
import { Phase, Payment } from '@/lib/firebase/schema';
import { getPayments, addPayment, updatePayment, deletePayment, batchAddPayments, clearPayments, batchUpdatePayments } from '@/lib/firebase/db';
import { FileSpreadsheet, Plus, Trash2, Pencil, Check, X, CalendarDays, MoreVertical } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface PaymentScheduleManagerProps {
  projectId: string;
  phases: Phase[];
}

const InlinePercentInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  const [val, setVal] = useState(value.toString());
  
  useEffect(() => {
    setVal(value.toString());
  }, [value]);

  const handleBlur = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num !== value) {
      onChange(num);
    } else {
      setVal(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
      <input 
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20 text-right bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 px-1 py-1 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0"
      />
      <span className="text-slate-500 text-sm font-bold pr-2">%</span>
    </div>
  );
};

export function PaymentScheduleManager({ projectId, phases }: PaymentScheduleManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Payment Form
  const [newName, setNewName] = useState('');
  const [newPercentage, setNewPercentage] = useState('');
  const [newPhaseId, setNewPhaseId] = useState(''); // empty string means independent

  // Edit Payment Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPercentage, setEditPercentage] = useState('');
  const [editPhaseId, setEditPhaseId] = useState('');

  // Context Menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadPayments = async () => {
    setLoading(true);
    const data = await getPayments(projectId);
    setPayments(data.sort((a, b) => a.order - b.order));
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPercentage) return;
    
    await addPayment({
      projectId,
      phaseId: newPhaseId || undefined,
      name: newName.trim(),
      percentage: parseFloat(newPercentage) || 0,
      order: payments.length > 0 ? Math.max(...payments.map(p => p.order)) + 1 : 1
    });
    
    setNewName('');
    setNewPercentage('');
    setNewPhaseId('');
    await loadPayments();
  };

  const handleEditStart = (p: Payment) => {
    setEditingId(p.id!);
    setEditName(p.name);
    setEditPercentage(p.percentage.toString());
    setEditPhaseId(p.phaseId || '');
    setMenuOpenId(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      await updatePayment(editingId, {
        name: editName.trim(),
        percentage: parseFloat(editPercentage) || 0,
        phaseId: editPhaseId || undefined
      });
      setEditingId(null);
      await loadPayments();
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payment Stage',
      message: 'Are you sure you want to delete this payment stage? This action cannot be undone.',
      confirmText: 'Delete Payment',
      onConfirm: async () => {
        await deletePayment(id);
        await loadPayments();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
    setMenuOpenId(null);
  };

  const handleAddBeforeAfter = async (targetPayment: Payment, position: 'before' | 'after') => {
    const newOrder = position === 'before' ? targetPayment.order - 0.5 : targetPayment.order + 0.5;
    await addPayment({
      projectId,
      phaseId: targetPayment.phaseId, // default to same phase
      name: 'New Payment',
      percentage: 0,
      order: newOrder
    });
    
    // Fetch and re-normalize orders
    const data = await getPayments(projectId);
    const sorted = data.sort((a, b) => a.order - b.order);
    
    const updates = sorted.map((p, index) => ({ id: p.id!, data: { order: index + 1 } }));
    await batchUpdatePayments(updates);
    
    await loadPayments();
    setMenuOpenId(null);
  };

  const handleUseTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);
    
    const newPayments: Omit<Payment, 'id' | 'companyId'>[] = [];
    let order = 1;
    
    // 1. Mobilisation
    newPayments.push({
      projectId,
      name: 'Mobilisation',
      percentage: 10,
      order: order++
    });
    
    // 2. Payments per phase
    if (phases.length > 0) {
      const remainingPercent = 85;
      const percentPerPhase = parseFloat((remainingPercent / phases.length).toFixed(2));
      
      // Sort phases to ensure correct chronological order
      const sortedPhases = [...phases].sort((a,b) => a.order - b.order);
      
      sortedPhases.forEach(phase => {
        newPayments.push({
          projectId,
          phaseId: phase.id,
          name: `Completion of ${phase.name}`,
          percentage: percentPerPhase,
          order: order++
        });
      });
      
      // Fix rounding error on the last phase to ensure exactly 85% is distributed
      const totalPhasePercent = percentPerPhase * phases.length;
      if (totalPhasePercent !== remainingPercent) {
        newPayments[newPayments.length - 1].percentage = parseFloat((percentPerPhase + (remainingPercent - totalPhasePercent)).toFixed(2));
      }
    }
    
    // 3. Final Approval
    newPayments.push({
      projectId,
      name: 'Final Approval',
      percentage: 5,
      order: order++
    });
    
    await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  const handleMonthlyTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);
    
    const newPayments: Omit<Payment, 'id' | 'companyId'>[] = [];
    let order = 1;
    
    newPayments.push({
      projectId,
      name: 'Mobilisation',
      percentage: 10,
      order: order++
    });
    
    if (phases.length > 0) {
      const remainingPercent = 85; // Reserve 5% for final
      
      // Calculate total project duration to find weight of each phase
      const totalDuration = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
      
      const sortedPhases = [...phases].sort((a,b) => a.order - b.order);
      
      sortedPhases.forEach(phase => {
        // Find how much of the 85% this phase gets based on duration length
        const phaseWeightPercent = totalDuration > 0 ? (phase.durationWeeks / totalDuration) * remainingPercent : 0;
        
        // Split into 4-week chunks (roughly 1 month)
        const numPayments = Math.max(1, Math.ceil(phase.durationWeeks / 4));
        const percentPerPayment = parseFloat((phaseWeightPercent / numPayments).toFixed(2));
        
        for (let i = 1; i <= numPayments; i++) {
          newPayments.push({
            projectId,
            phaseId: phase.id,
            name: `${phase.name} - Payment ${i}`,
            percentage: percentPerPayment,
            order: order++
          });
        }
      });
      
      // Fix global rounding error on the last phase payment
      const totalPhasePercent = newPayments.slice(1).reduce((sum, p) => sum + p.percentage, 0);
      if (totalPhasePercent !== remainingPercent && newPayments.length > 1) {
        newPayments[newPayments.length - 1].percentage = parseFloat((newPayments[newPayments.length - 1].percentage + (remainingPercent - totalPhasePercent)).toFixed(2));
      }
    }
    
    newPayments.push({
      projectId,
      name: 'Final Approval',
      percentage: 5,
      order: order++
    });
    
    await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);

  if (loading) return <div className="p-8 flex-1 text-slate-500 flex items-center justify-center">Loading payments...</div>;

  return (
    <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors flex justify-between items-start">
        <div>
          <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">Payment Schedule</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage payment milestones for this project.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUseTemplate} className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap">
            <FileSpreadsheet size={14} />
            By Phase
          </button>
          <button onClick={handleMonthlyTemplate} className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1.5">
            <CalendarDays size={14} />
            Monthly
          </button>
        </div>
      </div>
      
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Payment Name</label>
            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Phase 1 Completion" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors" />
          </div>
          <div className="flex gap-3 items-end">
            <div className="w-32">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">% Value</label>
              <input type="number" required min="0" step="0.01" value={newPercentage} onChange={e => setNewPercentage(e.target.value)} placeholder="10" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Link to Phase</label>
              <select value={newPhaseId} onChange={e => setNewPhaseId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors">
                <option value="">(None)</option>
                {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" className="h-[38px] px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-semibold flex items-center justify-center gap-2"><Plus size={16} /> Add</button>
          </div>
        </form>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-2 bg-slate-50/30 dark:bg-slate-900/30 transition-colors relative">
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Allocation:</span>
          <span className={`text-sm font-bold ${totalPercentage === 100 ? 'text-emerald-600' : totalPercentage > 100 ? 'text-rose-600' : 'text-orange-500'}`}>
            {totalPercentage.toFixed(2)}%
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center text-slate-400 dark:text-slate-600 py-8 flex flex-col items-center gap-2">
            <FileSpreadsheet size={40} className="text-slate-200 dark:text-slate-700" />
            <p className="text-sm">No payments scheduled.</p>
          </div>
        ) : (
          payments.map((payment, index) => {
            const linkedPhase = phases.find(p => p.id === payment.phaseId);
            
            if (editingId === payment.id) {
              return (
                <div key={payment.id} className="p-3 border border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center gap-2">
                  <form onSubmit={handleEditSave} className="flex-1 flex flex-col gap-2">
                    <input type="text" autoFocus required value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20" />
                    <div className="flex gap-2 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">%:</span>
                        <input type="number" required min="0" step="0.01" value={editPercentage} onChange={e => setEditPercentage(e.target.value)} className="w-28 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-center" />
                      </div>
                      <div className="flex-1">
                        <select value={editPhaseId} onChange={e => setEditPhaseId(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                          <option value="">(None)</option>
                          {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
                        <button type="submit" className="text-emerald-600 hover:text-emerald-700 p-1"><Check size={16} /></button>
                      </div>
                    </div>
                  </form>
                </div>
              );
            }

            return (
              <div key={payment.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm group">
                <div className="flex flex-col overflow-hidden pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">{index + 1}.</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{payment.name}</span>
                  </div>
                  {linkedPhase && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider ml-7 mt-0.5">
                      Phase: {linkedPhase.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  <InlinePercentInput 
                    value={payment.percentage} 
                    onChange={async (newVal) => {
                      if (payment.id) {
                        await updatePayment(payment.id, { percentage: newVal });
                        loadPayments();
                      }
                    }} 
                  />
                  
                  <button 
                    onClick={() => setMenuOpenId(menuOpenId === payment.id ? null : payment.id!)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {menuOpenId === payment.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-0 top-10 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                        <button onClick={() => handleEditStart(payment)} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                          <Pencil size={14} /> Edit Payment
                        </button>
                        <button onClick={() => handleAddBeforeAfter(payment, 'before')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                          <Plus size={14} /> Add Payment Before
                        </button>
                        <button onClick={() => handleAddBeforeAfter(payment, 'after')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                          <Plus size={14} /> Add Payment After
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        <button onClick={() => handleDelete(payment.id!)} className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2">
                          <Trash2 size={14} /> Delete Payment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
