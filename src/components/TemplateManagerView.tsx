import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  AlertOctagon, 
  Check, 
  Download, 
  Upload, 
  X
} from 'lucide-react';
import { ChecklistItem } from '../types';

interface TemplateManagerViewProps {
  items: ChecklistItem[];
  onSaveItems: (items: ChecklistItem[]) => void;
  onResetToDefault: () => void;
}

export const TemplateManagerView: React.FC<TemplateManagerViewProps> = ({
  items,
  onSaveItems,
  onResetToDefault,
}) => {
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [importText, setImportText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Form state for Add/Edit
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<number>(10);
  const [isCrucial, setIsCrucial] = useState<boolean>(false);
  const [sopGuide, setSopGuide] = useState('');

  // Categories list
  const existingCategories = Array.from(new Set(items.map((i) => i.category)));

  // Open Edit Modal
  const handleOpenEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setDescription(item.description);
    setPoints(item.points);
    setIsCrucial(item.isCrucial);
    setSopGuide(item.sopGuide || '');
    setIsAddingNew(false);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setCategory(existingCategories[0] || 'Server Room & Power');
    setNewCustomCategory('');
    setDescription('');
    setPoints(10);
    setIsCrucial(false);
    setSopGuide('');
    setIsAddingNew(true);
  };

  // Save Add / Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = category === '__custom__' && newCustomCategory.trim() 
      ? newCustomCategory.trim() 
      : category;

    if (isAddingNew) {
      const newItem: ChecklistItem = {
        id: `item-${Date.now()}`,
        title: title.trim(),
        category: finalCategory,
        description: description.trim(),
        points: Number(points) || 10,
        isCrucial,
        sopGuide: sopGuide.trim() || undefined,
        order: items.length + 1,
      };
      onSaveItems([...items, newItem]);
    } else if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: title.trim(),
              category: finalCategory,
              description: description.trim(),
              points: Number(points) || 10,
              isCrucial,
              sopGuide: sopGuide.trim() || undefined,
            }
          : it
      );
      onSaveItems(updated);
    }

    setIsAddingNew(false);
    setEditingItem(null);
  };

  // Delete Item
  const handleDeleteItem = (id: string, itemTitle: string) => {
    if (window.confirm(`Delete checklist item "${itemTitle}"?`)) {
      onSaveItems(items.filter((i) => i.id !== id));
    }
  };

  // Move Order
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    newItems.forEach((it, idx) => {
      it.order = idx + 1;
    });

    onSaveItems(newItems);
  };

  // Export items
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-checklist-template-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import items
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
        onSaveItems(parsed);
        setShowImportModal(false);
        setImportText('');
        alert('Checklist template successfully imported!');
      } else {
        alert('Invalid JSON structure. Please ensure an array of checklist items.');
      }
    } catch (e) {
      alert('Failed parsing JSON format.');
    }
  };

  const filtered = items.filter((it) =>
    filterCategory === 'all' ? true : it.category === filterCategory
  );

  const totalPossiblePoints = items.reduce((acc, i) => acc + i.points, 0);
  const crucialCount = items.filter((i) => i.isCrucial).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span>SOP & Master Template</span>
            <span aria-hidden="true">·</span>
            <span>Weighting & Parameter Configurations</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Checklist Item Management
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Download Template JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Template</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Upload Template JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Template</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all checklist items to default hospitality IT standards? Custom changes will be replaced.')) {
                onResetToDefault();
              }
            }}
            className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard SOP</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* 2. Key Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Checklist Items</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {items.length} Items
            </span>
            <span className="text-xs text-slate-500">
              {existingCategories.length} Categories
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Possible Points</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {totalPossiblePoints} Pts
            </span>
            <span className="text-xs text-slate-500">
              100% Score Baseline
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Crucial Items (Zero-Tolerance)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-600">
              {crucialCount} Items
            </span>
            <span className="text-xs text-rose-600 font-medium">
              Instant Alerts Active
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            filterCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({items.length})
        </button>
        {existingCategories.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 4. Item List Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((item, index) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{item.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-emerald-600 font-bold">
                  {item.points} Points
                </span>
                {item.isCrucial && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-600 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Crucial
                    </span>
                  </>
                )}
              </div>

              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600">
                {item.description}
              </p>

              {item.sopGuide && (
                <div className="text-[11px] text-slate-500 italic mt-0.5">
                  SOP: {item.sopGuide}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                title="Move Up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleMove(index, 'down')}
                disabled={index === items.length - 1}
                className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                title="Move Down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <button
                onClick={() => handleOpenEdit(item)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDeleteItem(item.id, item.title)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Add / Edit Modal Drawer */}
      {(isAddingNew || editingItem) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isAddingNew ? 'Add New Checklist Item' : 'Edit Checklist Item'}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure item title, category, point weighting, and crucial alert status.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingItem(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Room Temperature & Humidity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    System Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-medium"
                  >
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Create New Category...</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Score Points (Weight) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              {category === '__custom__' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    New Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audio Visual & Conference Rooms"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Item Description / Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Clear instructions on what the IT officer needs to inspect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Standard Operating Procedure (SOP) / Thresholds
                </label>
                <textarea
                  rows={2}
                  placeholder="Standard operating parameters and corrective steps if non-compliant..."
                  value={sopGuide}
                  onChange={(e) => setSopGuide(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                />
              </div>

              {/* Crucial Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="crucialCheck"
                  checked={isCrucial}
                  onChange={(e) => setIsCrucial(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="crucialCheck" className="cursor-pointer">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Mark as Crucial Item (Zero-Tolerance)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    If marked Not Comply during an inspection, an audible alarm will sound and an instant alert will be dispatched via WhatsApp and Webhook to the IT Manager / General Manager.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Import Checklist Template JSON
                </h2>
                <p className="text-xs text-slate-500">
                  Paste previously exported JSON checklist template content below.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[ { "title": "Server Room Temperature", "category": "Server Room & Power", "points": 15, "isCrucial": true } ... ]'
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Import Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
