import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Upload, Menu, Save, FolderOpen, X, AlertCircle } from 'lucide-react';
import { calculateFactoryRequirements, calculateEdgeFactories, calculatePerFactoryRate } from './calculations';

export default function FactoryCalculator() {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    output: 1,
    time: 1,
    required: [{ item: '', count: 1 }]
  });
  const [results, setResults] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [saves, setSaves] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [newSaveName, setNewSaveName] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [currentSaveId, setCurrentSaveId] = useState(null);

  const showNotification = (message, type = 'error') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load saves list and current work on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedList = localStorage.getItem('factory-saves-list');
        if (savedList) {
          setSaves(JSON.parse(savedList));
        }
        
        // Load current working state
        const saved = localStorage.getItem('factory-items-current');
        if (saved) {
          setItems(JSON.parse(saved));
        }
        
        const savedCompleted = localStorage.getItem('factory-completed-current');
        if (savedCompleted) {
          setCompletedItems(new Set(JSON.parse(savedCompleted)));
        }
      } catch (error) {
        console.log('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-save current work
  useEffect(() => {
    if (!isLoading && items.length >= 0) {
      try {
        localStorage.setItem('factory-items-current', JSON.stringify(items));
      } catch (error) {
        console.error('Failed to save items:', error);
      }
    }
  }, [items, isLoading]);

  // Auto-save completed items
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('factory-completed-current', JSON.stringify(Array.from(completedItems)));
      } catch (error) {
        console.error('Failed to save completed items:', error);
      }
    }
  }, [completedItems, isLoading]);

  useEffect(() => {
    if (items.length > 0) {
      calculate();
    } else {
      setResults(null);
    }
  }, [items]);

  const addRequirement = () => {
    setCurrentItem({
      ...currentItem,
      required: [...currentItem.required, { item: '', count: 1 }]
    });
  };

  const updateRequirement = (index, field, value) => {
    const newRequired = [...currentItem.required];
    if (field === 'count') {
      newRequired[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      newRequired[index][field] = value;
    }
    setCurrentItem({ ...currentItem, required: newRequired });
  };

  const removeRequirement = (index) => {
    setCurrentItem({
      ...currentItem,
      required: currentItem.required.filter((_, i) => i !== index)
    });
  };

  const addItem = () => {
    if (!currentItem.name.trim()) {
      showNotification('Item name is required', 'error');
      return;
    }
    
    const filteredRequired = currentItem.required.filter(r => r.item.trim() !== '');
    
    // Auto-add missing items as placeholders
    const newItems = [...items];
    const existingNames = new Set(items.map(i => i.name));
    
    filteredRequired.forEach(req => {
      if (!existingNames.has(req.item)) {
        newItems.push({
          name: req.item,
          output: null,
          time: null,
          required: [],
          isPlaceholder: true
        });
        existingNames.add(req.item);
      }
    });
    
    newItems.push({ ...currentItem, required: filteredRequired, isPlaceholder: false });
    setItems(newItems);
    
    setCurrentItem({
      name: '',
      output: 1,
      time: 1,
      required: [{ item: '', count: 1 }]
    });
  };

  const removeItem = (index) => {
    const itemToDelete = items[index];
    
    // Find all items that reference this item
    const referencingItems = items.filter((item, i) => 
      i !== index && item.required.some(req => req.item === itemToDelete.name)
    );
    
    if (referencingItems.length > 0) {
      // Show confirmation dialog with options
      setDeleteConfirmation({
        index,
        itemName: itemToDelete.name,
        referencingItems: referencingItems.map(item => item.name)
      });
    } else {
      // No references, safe to delete
      setItems(items.filter((_, i) => i !== index));
      setSelectedItem(null);
    }
  };
  
  const confirmDelete = (removeRelations) => {
    if (!deleteConfirmation) return;
    
    const { index, itemName } = deleteConfirmation;
    
    if (removeRelations) {
      // Remove the item and all references to it
      const updatedItems = items
        .filter((_, i) => i !== index)
        .map(item => ({
          ...item,
          required: item.required.filter(req => req.item !== itemName)
        }));
      setItems(updatedItems);
    } else {
      // Delete and create placeholder (mark as deleted)
      const updatedItems = items.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            output: null,
            time: null,
            required: [],
            isPlaceholder: true,
            isDeleted: true
          };
        }
        return item;
      });
      setItems(updatedItems);
    }
    
    setSelectedItem(null);
    setDeleteConfirmation(null);
  };

  const calculate = () => {
    const result = calculateFactoryRequirements(items);
    setResults(result);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'g') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomSpeed = 0.001;
    const zoomFactor = 1 - delta * zoomSpeed;
    
    // Get mouse position relative to SVG
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const oldZoom = zoom;
    const newZoom = Math.max(0.3, Math.min(3, oldZoom * zoomFactor));
    
    // Calculate the point in world coordinates
    const worldX = (mouseX - pan.x) / oldZoom;
    const worldY = (mouseY - pan.y) / oldZoom;
    
    // Adjust pan to keep the world point under the cursor
    setPan({
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom
    });
    
    setZoom(newZoom);
  };

  const openEditModal = (itemName) => {
    console.log('Opening edit for:', itemName);
    console.log('All items:', items.map(i => i.name));
    const item = items.find(i => i.name === itemName);
    console.log('Found item:', item);
    if (!item) {
      console.error('Item not found:', itemName);
      return;
    }
    setEditingItem(itemName);
    setEditForm({
      name: item.name,
      output: item.output === null ? 1 : item.output,
      time: item.time === null ? 1 : item.time,
      required: item.required && item.required.length > 0 ? [...item.required] : [{ item: '', count: 1 }]
    });
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) {
      showNotification('Item name is required', 'error');
      return;
    }

    const filteredRequired = editForm.required.filter(r => r.item.trim() !== '');
    
    // First, update the item being edited
    let updatedItems = items.map(item => 
      item.name === editingItem 
        ? { ...editForm, required: filteredRequired, isPlaceholder: false }
        : item
    );

    // Then auto-add any missing items as placeholders
    const existingNames = new Set(updatedItems.map(i => i.name));
    const newPlaceholders = [];
    
    filteredRequired.forEach(req => {
      if (!existingNames.has(req.item)) {
        newPlaceholders.push({
          name: req.item,
          output: null,
          time: null,
          required: [],
          isPlaceholder: true
        });
        existingNames.add(req.item);
      }
    });

    setItems([...updatedItems, ...newPlaceholders]);
    setEditingItem(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  const addEditRequirement = () => {
    setEditForm({
      ...editForm,
      required: [...editForm.required, { item: '', count: 1 }]
    });
  };

  const updateEditRequirement = (index, field, value) => {
    const newRequired = [...editForm.required];
    if (field === 'count') {
      newRequired[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      newRequired[index][field] = value;
    }
    setEditForm({ ...editForm, required: newRequired });
  };

  const removeEditRequirement = (index) => {
    setEditForm({
      ...editForm,
      required: editForm.required.filter((_, i) => i !== index)
    });
  };

  const toggleItemCompletion = (itemName) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const saveCurrentWork = (overwrite = false) => {
    if (!overwrite && !newSaveName.trim()) {
      showNotification('Please enter a save name', 'error');
      return;
    }
    
    let saveId, saveName, updatedSaves;
    
    if (overwrite && currentSaveId) {
      // Overwrite existing save
      saveId = currentSaveId;
      saveName = saves.find(s => s.id === currentSaveId)?.name || 'save';
      updatedSaves = saves.map(s => 
        s.id === currentSaveId 
          ? { ...s, date: new Date().toISOString() }
          : s
      );
    } else {
      // Create new save
      saveId = `save-${Date.now()}`;
      saveName = newSaveName.trim();
      const newSave = { 
        id: saveId, 
        name: saveName,
        date: new Date().toISOString()
      };
      updatedSaves = [...saves, newSave];
      setCurrentSaveId(saveId);
    }
    
    // Save current work
    localStorage.setItem(`factory-items-${saveId}`, JSON.stringify(items));
    localStorage.setItem(`factory-completed-${saveId}`, JSON.stringify(Array.from(completedItems)));
    
    setSaves(updatedSaves);
    localStorage.setItem('factory-saves-list', JSON.stringify(updatedSaves));
    setNewSaveName('');
    setShowSaveDialog(false);
    showNotification(`Saved as "${saveName}"`, 'success');
  };

  const loadSave = (saveId) => {
    try {
      const saved = localStorage.getItem(`factory-items-${saveId}`);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        setItems([]);
      }
      
      const savedCompleted = localStorage.getItem(`factory-completed-${saveId}`);
      if (savedCompleted) {
        setCompletedItems(new Set(JSON.parse(savedCompleted)));
      } else {
        setCompletedItems(new Set());
      }
      
      setCurrentSaveId(saveId);
      setShowLoadDialog(false);
      const saveName = saves.find(s => s.id === saveId)?.name || 'save';
      showNotification(`Loaded "${saveName}"`, 'success');
    } catch (error) {
      console.error('Error loading save:', error);
      showNotification('Error loading save', 'error');
    }
  };

  const deleteSave = (saveId) => {
    const updatedSaves = saves.filter(s => s.id !== saveId);
    setSaves(updatedSaves);
    localStorage.setItem('factory-saves-list', JSON.stringify(updatedSaves));
    localStorage.removeItem(`factory-items-${saveId}`);
    localStorage.removeItem(`factory-completed-${saveId}`);
  };

  const createNew = () => {
    setItems([]);
    setCompletedItems(new Set());
    setSelectedItem(null);
    setEditingItem(null);
    setEditForm(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCurrentSaveId(null);
  };

  const exportData = () => {
    const data = {
      items,
      completedItems: Array.from(completedItems),
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factory-calculator-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
        }
        
        if (data.completedItems && Array.isArray(data.completedItems)) {
          setCompletedItems(new Set(data.completedItems));
        }
        showNotification('Data imported successfully', 'success');
      } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white min-w-64 max-w-md ${
              notification.type === 'error' ? 'bg-red-600' :
              notification.type === 'success' ? 'bg-green-600' :
              'bg-blue-600'
            }`}
          >
            <AlertCircle size={20} />
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="hover:bg-white/20 p-1 rounded transition"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
      {/* Left Panel - Input */}
      <div className={`${isPanelCollapsed ? 'w-0' : 'w-96'} transition-all duration-300 bg-white shadow-lg overflow-hidden flex flex-col`}>
        <div className="w-96 p-6 flex flex-col h-full">
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-800">Factory Calculator</h1>
            <button 
              onClick={() => setIsPanelCollapsed(true)} 
              className="p-1.5 hover:bg-gray-100 rounded-md transition"
              title="Hide panel"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          </div>
          
          {/* Save/Load Buttons */}
          <div className="mb-3">
            <div className="flex gap-2">
              <button
                onClick={createNew}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm font-medium"
              >
                <Plus size={16} />
                New
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={() => setShowLoadDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium"
              >
                <FolderOpen size={16} />
                Load
              </button>
            </div>
          </div>
          
          {/* Export/Import Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
            >
              <Download size={16} />
              Export
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium cursor-pointer">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        <div className="space-y-4 mb-6 flex-shrink-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={currentItem.name}
              onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., iron_rod"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output</label>
              <input
                type="number"
                value={currentItem.output}
                onChange={(e) => setCurrentItem({ ...currentItem, output: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time (s)</label>
              <input
                type="number"
                value={currentItem.time}
                onChange={(e) => setCurrentItem({ ...currentItem, time: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Required Items</label>
            {currentItem.required.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={req.item}
                  onChange={(e) => updateRequirement(index, 'item', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Item name"
                />
                <input
                  type="number"
                  value={req.count}
                  onChange={(e) => updateRequirement(index, 'count', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0.1"
                  step="0.1"
                />
                <button
                  onClick={() => removeRequirement(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={addRequirement}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus size={16} /> Add Requirement
            </button>
          </div>

          <button
            onClick={addItem}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium transition"
          >
            Add Item
          </button>
        </div>

        <div className="border-t pt-4 flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-semibold mb-3 flex-shrink-0">Items ({items.length})</h2>
          <div className="space-y-2 overflow-y-auto flex-1">
            {items.map((item, index) => (
              <div 
                key={index} 
                className={`border rounded-md p-2 cursor-pointer transition ${
                  selectedItem === item.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedItem(selectedItem === item.name ? null : item.name)}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-gray-800">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {item.output} in {item.time}s
                  {item.required.length > 0 && ` • ${item.required.length} inputs`}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Save Current Work</h2>
            
            {currentSaveId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-900">
                  Currently editing: {saves.find(s => s.id === currentSaveId)?.name}
                </div>
                <button
                  onClick={() => saveCurrentWork(true)}
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                >
                  Overwrite Save
                </button>
              </div>
            )}
            
            <div className={currentSaveId ? "pt-3 border-t" : ""}>
              {currentSaveId && (
                <div className="text-sm font-medium text-gray-700 mb-2">Or save as new:</div>
              )}
              <input
                type="text"
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && newSaveName.trim() && saveCurrentWork(false)}
                placeholder="Save name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus={!currentSaveId}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewSaveName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveCurrentWork(false)}
                  disabled={!newSaveName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as New
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLoadDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Load Save</h2>
            {saves.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saves yet</p>
            ) : (
              <div className="space-y-2">
                {saves.map(save => (
                  <div key={save.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <button
                      onClick={() => loadSave(save.id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-gray-800">{save.name}</div>
                      {save.date && (
                        <div className="text-xs text-gray-500">
                          {new Date(save.date).toLocaleString()}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => deleteSave(save.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteConfirmation(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">Delete "{deleteConfirmation.itemName}"?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  This item is referenced by {deleteConfirmation.referencingItems.length} other item{deleteConfirmation.referencingItems.length > 1 ? 's' : ''}:
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-3 mb-4 max-h-32 overflow-y-auto">
              <ul className="text-sm text-gray-700 space-y-1">
                {deleteConfirmation.referencingItems.map((name, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => confirmDelete(true)}
                className="w-full bg-red-600 text-white py-2.5 px-4 rounded-md hover:bg-red-700 font-medium transition text-left flex items-start gap-3"
              >
                <div className="flex-1">
                  <div className="font-semibold">Remove All Relations</div>
                  <div className="text-xs text-red-100 mt-0.5">
                    Delete this item and remove it from all recipes that use it
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => confirmDelete(false)}
                className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-md hover:bg-orange-700 font-medium transition text-left flex items-start gap-3"
              >
                <div className="flex-1">
                  <div className="font-semibold">Delete Node Only</div>
                  <div className="text-xs text-orange-100 mt-0.5">
                    Mark as deleted (creates red placeholder, keeps relations intact)
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="w-full bg-gray-200 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-300 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Panel - Graph */}
      <div className="flex-1 relative bg-gray-100">
        {isPanelCollapsed && (
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={() => setIsPanelCollapsed(false)} 
              className="p-2 bg-white rounded-md shadow hover:bg-gray-50"
              title="Show panel"
            >
              <Menu size={20} />
            </button>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button onClick={handleZoomIn} className="p-2 bg-white rounded-md shadow hover:bg-gray-50">
            <ZoomIn size={20} />
          </button>
          <button onClick={handleZoomOut} className="p-2 bg-white rounded-md shadow hover:bg-gray-50">
            <ZoomOut size={20} />
          </button>
        </div>

        {selectedItem && (
          <div className={`absolute top-4 ${isPanelCollapsed ? 'left-20' : 'left-4'} bg-white rounded-md shadow-lg p-4 z-10 max-w-sm`}>
            <div className="text-sm font-semibold text-gray-800 mb-2">{selectedItem}</div>
            {results && results.factoryCount[selectedItem] && (
              <div className="space-y-1">
                <div className="text-xs text-gray-600">
                  Factories: {results.factoryCount[selectedItem]}
                </div>
              </div>
            )}
          </div>
        )}

        <svg
          ref={svgRef}
          className="w-full h-full cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={() => setContextMenu(null)}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <GraphVisualization 
              results={results} 
              items={items}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onEditItem={openEditModal}
              completedItems={completedItems}
              onToggleCompletion={toggleItemCompletion}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />
          </g>
        </svg>

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="absolute bg-white rounded-md shadow-lg border border-gray-200 py-1 z-30"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                toggleItemCompletion(contextMenu.itemName);
                setContextMenu(null);
              }}
            >
              {completedItems.has(contextMenu.itemName) ? (
                <>
                  <span className="text-gray-600">☐</span>
                  <span>Mark as Incomplete</span>
                </>
              ) : (
                <>
                  <span className="text-green-600">☑</span>
                  <span>Mark as Complete</span>
                </>
              )}
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                openEditModal(contextMenu.itemName);
                setContextMenu(null);
              }}
            >
              <span>✎</span>
              <span>Edit Item</span>
            </button>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && editForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Item</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Output</label>
                    <input
                      type="number"
                      value={editForm.output}
                      onChange={(e) => setEditForm({ ...editForm, output: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time (s)</label>
                    <input
                      type="number"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Items</label>
                  {editForm.required.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={req.item}
                        onChange={(e) => updateEditRequirement(index, 'item', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Item name"
                      />
                      <input
                        type="number"
                        value={req.count}
                        onChange={(e) => updateEditRequirement(index, 'count', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                        min="0.1"
                        step="0.1"
                      />
                      <button
                        onClick={() => removeEditRequirement(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addEditRequirement}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus size={16} /> Add Requirement
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!results && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium">Add items to see the production graph</div>
              <div className="text-sm mt-2">Items will auto-calculate and display here</div>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function GraphVisualization({ results, items, selectedItem, onSelectItem, onEditItem, completedItems, onToggleCompletion, contextMenu, setContextMenu }) {
  const [layout, setLayout] = useState(null);
  const [fullLayout, setFullLayout] = useState(null);
  const [focusedLayout, setFocusedLayout] = useState(null);
  const [animatedLayout, setAnimatedLayout] = useState(null);

  useEffect(() => {
    if (items.length === 0) {
      setLayout(null);
      setFullLayout(null);
      return;
    }

    const nodes = items.map(item => ({
      id: item.name,
      ...item
    }));

    const links = [];
    items.forEach(item => {
      if (item.required) {
        item.required.forEach(req => {
          if (!req.item) return;
          
          const perFactoryRate = calculatePerFactoryRate(item);
          const edgeKey = `${req.item}->${item.name}`;
          const factoriesForEdge = results?.edgeContributions?.[edgeKey] || 0;
          
          links.push({
            source: req.item,
            target: item.name,
            count: req.count,
            perFactoryRate,
            factoriesForEdge: factoriesForEdge
          });
        });
      }
    });

    // Calculate levels (depth from raw materials)
    const levels = {};
    const visited = new Set();
    
    const calculateLevel = (itemName, level = 0) => {
      if (visited.has(itemName)) return;
      visited.add(itemName);
      
      if (!levels[itemName] || levels[itemName] < level) {
        levels[itemName] = level;
      }
      
      const item = items.find(i => i.name === itemName);
      if (item && !item.isPlaceholder) {
        item.required.forEach(req => {
          calculateLevel(req.item, level - 1);
        });
      }
    };

    // Start from final products if results exist, otherwise use all valid items
    if (results?.finalProducts) {
      results.finalProducts.forEach(product => calculateLevel(product));
    } else {
      items.filter(item => !item.isPlaceholder).forEach(item => {
        calculateLevel(item.name);
      });
    }

    // Normalize levels to start from 0
    const minLevel = Math.min(...Object.values(levels));
    Object.keys(levels).forEach(key => {
      levels[key] -= minLevel;
    });

    const maxLevel = Math.max(...Object.values(levels));
    const levelGroups = {};
    Object.entries(levels).forEach(([name, level]) => {
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(name);
    });

    // Calculate box widths for each node
    const nodeWidths = {};
    nodes.forEach(node => {
      const textLength = node.id.length;
      nodeWidths[node.id] = Math.max(120, textLength * 8 + 20);
    });

    // Position nodes with dynamic spacing based on actual box widths
    const levelHeight = 180; // Vertical spacing between levels
    
    // Calculate dynamic padding based on whether there are connections between level items
    const hasHorizontalConnections = links.some(link => {
      const sourceLevel = levels[link.source];
      const targetLevel = levels[link.target];
      return sourceLevel === targetLevel;
    });
    
    const padding = hasHorizontalConnections ? 100 : 60; // More space if there are horizontal connections
    
    nodes.forEach(node => {
      const level = levels[node.id] || 0;
      const groupSize = levelGroups[level].length;
      const levelNodes = levelGroups[level];
      const indexInGroup = levelNodes.indexOf(node.id);
      
      // Calculate total width needed for this level
      const totalWidth = levelNodes.reduce((sum, nodeName) => sum + nodeWidths[nodeName], 0) 
                        + (padding * (groupSize - 1));
      
      // Calculate x position by summing up previous node widths
      let x = -(totalWidth / 2);
      for (let i = 0; i < indexInGroup; i++) {
        x += nodeWidths[levelNodes[i]] / 2;
        if (i === 0) x += nodeWidths[levelNodes[i]] / 2;
        else x += nodeWidths[levelNodes[i]] / 2 + padding;
      }
      if (indexInGroup === 0) {
        x += nodeWidths[node.id] / 2;
      } else {
        x += nodeWidths[node.id] / 2 + padding;
      }
      
      node.x = x;
      node.y = levelHeight * (level + 1);
    });

    const fullLayoutData = { nodes, links };
    setFullLayout(fullLayoutData);
    if (!selectedItem) {
      setLayout(fullLayoutData);
    }
  }, [results, items]);

  // Create focused layout when an item is selected
  useEffect(() => {
    if (!selectedItem || !fullLayout) {
      if (fullLayout) {
        setLayout(fullLayout);
      }
      setFocusedLayout(null);
      return;
    }

    const item = items.find(i => i.name === selectedItem);
    if (!item) return;

    // Create a focused layout with selected item in center
    const focusedNodes = [];
    const focusedLinks = [];
    
    // Add the selected item at center
    const selectedNode = fullLayout.nodes.find(n => n.id === selectedItem);
    if (!selectedNode) return;

    focusedNodes.push({
      ...selectedNode,
      x: 0,
      y: 0,
      originalX: selectedNode.x,
      originalY: selectedNode.y
    });

    // Add upstream items (ingredients) - arranged above
    const upstreamItems = item.required.map(req => req.item);
    const angleStep = Math.PI / Math.max(upstreamItems.length, 1);
    const radius = 250;
    
    upstreamItems.forEach((reqItem, idx) => {
      const node = fullLayout.nodes.find(n => n.id === reqItem);
      if (!node) return;
      
      const angle = -Math.PI / 2 + (idx - (upstreamItems.length - 1) / 2) * angleStep * 0.8;
      focusedNodes.push({
        ...node,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius - 50,
        originalX: node.x,
        originalY: node.y
      });
      
      const link = fullLayout.links.find(l => l.source === reqItem && l.target === selectedItem);
      if (link) focusedLinks.push(link);
    });

    // Add downstream items (consumers) - arranged below
    const downstreamItems = fullLayout.links
      .filter(l => l.source === selectedItem)
      .map(l => l.target);
    
    const downAngleStep = Math.PI / Math.max(downstreamItems.length, 1);
    
    downstreamItems.forEach((consumer, idx) => {
      const node = fullLayout.nodes.find(n => n.id === consumer);
      if (!node) return;
      
      const angle = Math.PI / 2 + (idx - (downstreamItems.length - 1) / 2) * downAngleStep * 0.8;
      focusedNodes.push({
        ...node,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius + 50,
        originalX: node.x,
        originalY: node.y
      });
      
      const link = fullLayout.links.find(l => l.source === selectedItem && l.target === consumer);
      if (link) focusedLinks.push(link);
    });

    setFocusedLayout({ nodes: focusedNodes, links: focusedLinks });
  }, [selectedItem, fullLayout, items]);

  // Animate between layouts
  useEffect(() => {
    const targetLayout = selectedItem ? focusedLayout : fullLayout;
    if (!targetLayout) return;

    const duration = 500; // ms
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      if (!animatedLayout && layout) {
        // Initialize animation from current layout
        setAnimatedLayout(layout);
      }

      if (animatedLayout || layout) {
        const currentLayout = animatedLayout || layout;
        const newNodes = targetLayout.nodes.map(targetNode => {
          const currentNode = currentLayout.nodes.find(n => n.id === targetNode.id);
          if (!currentNode) return targetNode;
          
          return {
            ...targetNode,
            x: currentNode.x + (targetNode.x - currentNode.x) * eased,
            y: currentNode.y + (targetNode.y - currentNode.y) * eased
          };
        });

        setLayout({ nodes: newNodes, links: targetLayout.links });
        setAnimatedLayout({ nodes: newNodes, links: targetLayout.links });
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [focusedLayout, fullLayout, selectedItem]);

  if (!layout) return null;

  // Filter for selected item's direct connections only
  let visibleNodes = new Set(layout.nodes.map(n => n.id));
  let visibleLinks = layout.links;

  if (selectedItem) {
    visibleNodes = new Set([selectedItem]);
    visibleLinks = [];
    
    // Add direct upstream (what this item requires)
    const item = items.find(i => i.name === selectedItem);
    if (item) {
      item.required.forEach(req => {
        visibleNodes.add(req.item);
        visibleLinks.push(...layout.links.filter(l => l.target === selectedItem && l.source === req.item));
      });
    }
    
    // Add direct downstream (what requires this item)
    layout.links.filter(l => l.source === selectedItem).forEach(link => {
      visibleNodes.add(link.target);
      visibleLinks.push(link);
    });
  }

  return (
    <>
      {/* Links */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#666" />
        </marker>
      </defs>
      
      {visibleLinks.map((link, i) => {
        const sourceNode = layout.nodes.find(n => n.id === link.source);
        const targetNode = layout.nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return null;

        const isHighlighted = selectedItem && (link.source === selectedItem || link.target === selectedItem);
        
        // Calculate position offset to the right of the line
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;
        const perpX = -unitY * 15; // Offset to the right
        const perpY = unitX * 15;
        
        const midX = (sourceNode.x + targetNode.x) / 2 + perpX;
        const midY = (sourceNode.y + targetNode.y) / 2 + perpY;
        
        return (
          <g key={i}>
            <line
              x1={sourceNode.x}
              y1={sourceNode.y + 20}
              x2={targetNode.x}
              y2={targetNode.y - 20}
              stroke={isHighlighted ? "#3b82f6" : "#999"}
              strokeWidth={isHighlighted ? 3 : 2}
              markerEnd="url(#arrowhead)"
              opacity={selectedItem && !isHighlighted ? 0.2 : 1}
            />
            {selectedItem && isHighlighted && (
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                fontSize="12"
                fill="black"
                fontWeight="700"
                stroke="white"
                strokeWidth="3"
                paintOrder="stroke"
                style={{ pointerEvents: 'none' }}
              >
                {link.factoriesForEdge !== null && link.factoriesForEdge !== undefined
                  ? `${link.factoriesForEdge} factories`
                  : (link.perFactoryRate % 1 === 0 
                      ? `${link.perFactoryRate}/s`
                      : `${link.perFactoryRate.toFixed(2)}/s`)}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {layout.nodes.filter(node => visibleNodes.has(node.id)).map((node, i) => {
        const isSelected = node.id === selectedItem;
        const item = items.find(it => it.name === node.id);
        const isPlaceholder = item?.isPlaceholder;
        const isDeleted = item?.isDeleted;
        const isCompleted = completedItems?.has(node.id);
        const factoryCount = results?.factoryCount[node.id];
        
        // Calculate text width for dynamic box sizing
        const textLength = node.id.length;
        const boxWidth = Math.max(120, textLength * 8 + 20);
        
        return (
          <g 
            key={node.id} 
            transform={`translate(${node.x}, ${node.y})`}
            style={{ 
              opacity: selectedItem && !visibleNodes.has(node.id) ? 0.2 : 1
            }}
          >
            <rect
              x={-boxWidth/2}
              y="-20"
              width={boxWidth}
              height="40"
              rx="6"
              fill={isDeleted ? "#fecaca" : isPlaceholder ? "#fee2e2" : isCompleted ? "#d1fae5" : isSelected ? "#3b82f6" : "#fff"}
              stroke={isDeleted ? "#b91c1c" : isPlaceholder ? "#dc2626" : isCompleted ? "#10b981" : isSelected ? "#2563eb" : "#d1d5db"}
              strokeWidth={isDeleted ? "3" : "2"}
              strokeDasharray={isDeleted ? "5,3" : "none"}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem(isSelected ? null : node.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                setContextMenu({
                  x: e.clientX - svgRect.left,
                  y: e.clientY - svgRect.top,
                  itemName: node.id
                });
              }}
              style={{ cursor: 'pointer' }}
            />
            <text
              textAnchor="middle"
              y="-2"
              fontSize="13"
              fontWeight="600"
              fill={isDeleted ? "#991b1b" : isPlaceholder ? "#dc2626" : isCompleted ? "#059669" : isSelected ? "#fff" : "#1f2937"}
              style={{ pointerEvents: 'none', textDecoration: isDeleted ? 'line-through' : 'none' }}
            >
              {node.id}
            </text>
            <text
              textAnchor="middle"
              y="14"
              fontSize="11"
              fill={isDeleted ? "#991b1b" : isPlaceholder ? "#dc2626" : isCompleted ? "#059669" : isSelected ? "#dbeafe" : "#6b7280"}
              style={{ pointerEvents: 'none' }}
            >
              {isDeleted ? "DELETED" : isPlaceholder ? "?" : (factoryCount && (factoryCount % 1 === 0 
                ? `${factoryCount} factories`
                : `${factoryCount.toFixed(2)} factories`))}
            </text>
          </g>
        );
      })}
    </>
  );
}