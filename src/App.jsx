import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Upload, Menu, X, AlertCircle, Moon, Sun, Filter, Edit2, Settings, Gamepad2 } from 'lucide-react';
import { calculateFactoryRequirements, calculateEdgeFactories, calculatePerFactoryRate } from './calculations';
import { GAMES, getGameItems, getGameName, getAvailableGames } from './gameData';

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
  const [selectedNodePosition, setSelectedNodePosition] = useState(null);
  const [originalPan, setOriginalPan] = useState(null);
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
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const defaultGameSettings = { exactMode: false, timeUnit: 's', countsPerTimeUnit: false };
  const [gameSettings, setGameSettings] = useState(() => {
    const saved = localStorage.getItem('factory-game-settings');
    return saved ? JSON.parse(saved) : {};
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('factory-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [currentGame, setCurrentGame] = useState(() => {
    const saved = localStorage.getItem('factory-current-game');
    return saved || GAMES.CUSTOM;
  });
  const [targetItem, setTargetItem] = useState(null);
  const [targetFactoryCount, setTargetFactoryCount] = useState(1);
  const [showResourceTree, setShowResourceTree] = useState(false);
  const [customGames, setCustomGames] = useState(() => {
    const saved = localStorage.getItem('factory-custom-games');
    return saved ? JSON.parse(saved) : [];
  });
  const [showGameManager, setShowGameManager] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  // Index of currently focused requirement input for add-item form (null = none)
  const [reqDropdownIndex, setReqDropdownIndex] = useState(null);
  // Index of currently focused requirement input for edit form (null = none)
  const [editReqDropdownIndex, setEditReqDropdownIndex] = useState(null);
  const [editingGameId, setEditingGameId] = useState(null);
  const [editingGameName, setEditingGameName] = useState('');

  const showNotification = (message, type = 'error') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('factory-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Save current game
  useEffect(() => {
    localStorage.setItem('factory-current-game', currentGame);
  }, [currentGame]);

  // Save custom games
  useEffect(() => {
    localStorage.setItem('factory-custom-games', JSON.stringify(customGames));
  }, [customGames]);

  // Ensure current game has settings (defaults) and persist settings when changed
  useEffect(() => {
    setGameSettings(prev => {
      if (prev[currentGame]) return prev;
      return { ...prev, [currentGame]: defaultGameSettings };
    });
  }, [currentGame]);

  useEffect(() => {
    localStorage.setItem('factory-game-settings', JSON.stringify(gameSettings));
  }, [gameSettings]);

  // Auto-save items to current game
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    if (currentGame.startsWith('custom-')) {
      const customGame = customGames.find(g => g.id === currentGame);
      if (customGame) {
        const updatedGames = customGames.map(g => 
          g.id === currentGame 
            ? { ...g, items: [...items], updatedAt: new Date().toISOString() }
            : g
        );
        setCustomGames(updatedGames);
      }
    }
  }, [items, currentGame, isLoading]);

  // Auto-save completed items
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    localStorage.setItem(`factory-completed-${currentGame}`, JSON.stringify(Array.from(completedItems)));
  }, [completedItems, currentGame, isLoading]);

  // Load completed items when game changes
  useEffect(() => {
    const saved = localStorage.getItem(`factory-completed-${currentGame}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedItems(new Set(parsed));
        }
      } catch (e) {
        setCompletedItems(new Set());
      }
    } else {
      setCompletedItems(new Set());
    }
  }, [currentGame]);

  // Load items only when game changes (not when customGames updates from auto-save)
  useEffect(() => {
    const loadItems = () => {
      if (currentGame.startsWith('custom-')) {
        const saved = localStorage.getItem('factory-custom-games');
        if (saved) {
          const games = JSON.parse(saved);
          const customGame = games.find(g => g.id === currentGame);
          if (customGame && customGame.items) {
            setItems(customGame.items);
            setGameSettings(prev => ({ ...prev, [currentGame]: customGame.settings || defaultGameSettings }));
            setIsLoading(false);
            return;
          }
        }
        setItems([]);
      } else {
        // Load game template items
        const gameItems = getGameItems(currentGame);
        setItems(gameItems);
      }
      setIsLoading(false);
    };
    
    loadItems();
  }, [currentGame]);



  const currentGameSetting = gameSettings[currentGame] || defaultGameSettings;
  const exactMode = currentGameSetting.exactMode;
  const timeUnit = currentGameSetting.timeUnit;
  const timeUnitLabel = timeUnit === 'm' ? 'min' : 'sec';
  const countsPerTimeUnit = currentGameSetting.countsPerTimeUnit;

  const updateCurrentGameSetting = (key, value) => {
    setGameSettings(prev => {
      const curr = prev[currentGame] || defaultGameSettings;
      return { ...prev, [currentGame]: { ...curr, [key]: value } };
    });

    // If this is a custom game, also persist settings into the customGames object so exports/imports include them
    if (currentGame.startsWith('custom-')) {
      setCustomGames(prev => prev.map(g => g.id === currentGame ? { ...g, settings: { ...(g.settings || defaultGameSettings), [key]: value }, updatedAt: new Date().toISOString() } : g));
    }
  };

  useEffect(() => {
    if (items.length > 0 && !showResourceTree) {
      calculate();
    } else if (items.length === 0) {
      setResults(null);
    }
  }, [items, gameSettings, showResourceTree]);

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const wheelHandler = (e) => {
      handleWheel(e);
    };

    svg.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      svg.removeEventListener('wheel', wheelHandler);
    };
  }, [zoom, pan]);

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

  // When a suggestion is clicked in the add-item form
  const selectRequirementSuggestion = (index, name) => {
    updateRequirement(index, 'item', name);
    setReqDropdownIndex(null);
  };

  // When a suggestion is clicked in the edit-item form
  const selectEditRequirementSuggestion = (index, name) => {
    updateEditRequirement(index, 'item', name);
    setEditReqDropdownIndex(null);
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
      handleSelectItem(null);
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
    // If the game specifies that counts are per minute, treat every recipe time as 60 seconds for calculations
    const perUnitSeconds = timeUnit === 'm' ? 60 : 1;
    const itemsForCalc = items.map(item => ({ ...item, time: countsPerTimeUnit ? perUnitSeconds : item.time }));
    const result = calculateFactoryRequirements(itemsForCalc, exactMode);
    setResults(result);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSelectItem = (itemName, posInfo) => {
    if (itemName && posInfo) {
      // Selecting an item - store current pan position
      setOriginalPan({ ...pan });
      setSelectedNodePosition(posInfo);
      setSelectedItem(itemName);
    } else {
      // Deselecting - will animate back to original pan
      setSelectedNodePosition(null);
      setSelectedItem(itemName);
    }
  };

  const handleAnimatePan = (nodeX, nodeY, progress, isDeselecting) => {
    if (isDeselecting && originalPan) {
      // Animate back to original pan position
      const currentPan = pan;
      setPan({
        x: currentPan.x + (originalPan.x - currentPan.x) * progress,
        y: currentPan.y + (originalPan.y - currentPan.y) * progress
      });
      
      // Clear original pan when animation is complete
      if (progress >= 1) {
        setOriginalPan(null);
      }
    } else if (selectedNodePosition && svgRef.current) {
      // Calculate where the pan should be to keep the node at its original screen position
      const targetPanX = selectedNodePosition.screenX - nodeX * zoom;
      const targetPanY = selectedNodePosition.screenY - nodeY * zoom;
      
      setPan({
        x: targetPanX,
        y: targetPanY
      });
    }
  };

  const centerOnNode = (nodeX, nodeY) => {
    if (!svgRef.current) return { x: nodeX, y: nodeY };
    const rect = svgRef.current.getBoundingClientRect();
    // Return the screen position where the node currently appears
    return {
      screenX: pan.x + nodeX * zoom,
      screenY: pan.y + nodeY * zoom,
      initialX: nodeX,
      initialY: nodeY
    };
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



  const createNew = () => {
    setItems([]);
    setCompletedItems(new Set());
    handleSelectItem(null);
    setEditingItem(null);
    setEditForm(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTargetItem(null);
    setTargetFactoryCount(1);
    setShowResourceTree(false);
    setResults(null);
  };

  const loadGameTemplate = (gameId) => {
    const gameItems = getGameItems(gameId);
    const customGame = customGames.find(g => g.id === gameId);
    
    if (customGame) {
      setItems(customGame.items || []);
      setCurrentGame(gameId);
      showNotification(`Loaded ${customGame.name}`, 'success');
    } else if (gameItems.length > 0) {
      setItems(gameItems);
      setCurrentGame(gameId);
      showNotification(`Loaded ${getGameName(gameId)} template`, 'success');
    } else {
      setItems([]);
      setCurrentGame(gameId);
      showNotification(`Switched to ${gameId}`, 'success');
    }
    
    setCompletedItems(new Set());
    setTargetItem(null);
    setTargetFactoryCount(1);
    setShowResourceTree(false);
    // Don't clear results here - let the useEffect recalculate automatically when items change
  };

  const createCustomGame = () => {
    if (!newGameName.trim()) {
      showNotification('Please enter a game name', 'error');
      return;
    }

    const gameId = `custom-${Date.now()}`;
    const newGame = {
      id: gameId,
      name: newGameName.trim(),
      items: [...items], // Copy current items
      settings: defaultGameSettings,
      createdAt: new Date().toISOString()
    };

    setCustomGames([...customGames, newGame]);
    setCurrentGame(gameId);
    setNewGameName('');
    showNotification(`Created game "${newGame.name}"`, 'success');
  };



  const deleteCustomGame = (gameId) => {
    const game = customGames.find(g => g.id === gameId);
    if (!game) return;

    const updatedGames = customGames.filter(g => g.id !== gameId);
    setCustomGames(updatedGames);

    if (currentGame === gameId) {
      setCurrentGame(GAMES.CUSTOM);
      setItems([]);
    }

    showNotification(`Deleted game "${game.name}"`, 'success');
  };

  const renameCustomGame = (gameId, newName) => {
    if (!newName.trim()) {
      showNotification('Game name cannot be empty', 'error');
      return;
    }

    const updatedGames = customGames.map(g => 
      g.id === gameId 
        ? { ...g, name: newName.trim(), updatedAt: new Date().toISOString() }
        : g
    );

    setCustomGames(updatedGames);
    setEditingGameId(null);
    setEditingGameName('');
    showNotification(`Renamed to "${newName.trim()}"`, 'success');
  };

  const getAllAvailableGames = () => {
    const baseGames = getAvailableGames();
    const customGamesList = customGames.map(g => ({
      id: g.id,
      name: g.name,
      isCustom: true
    }));
    
    return [...baseGames, ...customGamesList];
  };

  const getCurrentGameName = () => {
    const customGame = customGames.find(g => g.id === currentGame);
    if (customGame) return customGame.name;
    return getGameName(currentGame);
  };

  const filterResourceTree = () => {
    if (!targetItem || !results) {
      showNotification('Please select a target item first', 'error');
      return;
    }
    handleSelectItem(null); // Clear any selected item to avoid interference
    setShowResourceTree(true);
    // Trigger recalculation with filtered items
    calculateFilteredTree();
  };

  const calculateFilteredTree = () => {
    if (!targetItem) return;

    // Build dependency tree - get only items needed for target
    const itemMap = new Map();
    items.forEach(item => itemMap.set(item.name, item));

    const requiredItems = new Set();
    const queue = [targetItem];
    requiredItems.add(targetItem);
    
    while (queue.length > 0) {
      const currentItemName = queue.shift();
      const currentItem = itemMap.get(currentItemName);
      
      if (currentItem && currentItem.required) {
        currentItem.required.forEach(req => {
          if (req.item && !requiredItems.has(req.item)) {
            requiredItems.add(req.item);
            queue.push(req.item);
          }
        });
      }
    }

    // Create filtered items list with ONLY dependencies
    const filteredItems = items.filter(item => requiredItems.has(item.name));
    
    // Modify the target item to have the desired factory count
    const modifiedItems = filteredItems.map(item => {
      if (item.name === targetItem) {
        // This is a copy for calculation, we want it to be a final product
        return { ...item };
      }
      return item;
    });

    // Calculate fresh with only these items - always use exact mode for filtering to get precise values
    const filteredResult = calculateFactoryRequirements(modifiedItems, true);
    
    // Scale results based on desired factory count
    const scale = targetFactoryCount / (filteredResult.factoryCount[targetItem] || 1);
    const scaledFactoryCount = {};
    const scaledEdgeContributions = {};
    
    Object.keys(filteredResult.factoryCount).forEach(itemName => {
      const scaledValue = filteredResult.factoryCount[itemName] * scale;
      scaledFactoryCount[itemName] = exactMode ? scaledValue : Math.ceil(scaledValue);
    });
    
    Object.keys(filteredResult.edgeContributions).forEach(edgeKey => {
      const scaledValue = filteredResult.edgeContributions[edgeKey] * scale;
      scaledEdgeContributions[edgeKey] = exactMode ? scaledValue : Math.ceil(scaledValue);
    });

    setResults({
      ...filteredResult,
      factoryCount: scaledFactoryCount,
      edgeContributions: scaledEdgeContributions,
      isFiltered: true,
      filteredFor: targetItem
    });
  };

  const getFilteredResults = () => {
    return results;
  };

  const getFilteredItems = () => {
    if (showResourceTree && results?.isFiltered) {
      // Only show items that have factory counts in the filtered result
      return items.filter(item => results.factoryCount[item.name]);
    }
    return items;
  };

  const exportData = () => {
    const data = {
      gameName: getCurrentGameName(),
      gameId: currentGame,
      items,
      completedItems: Array.from(completedItems),
      settings: currentGameSetting,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${getCurrentGameName().replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    link.download = fileName;
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
          // Check if this is a game export (version 2.0+)
          if (data.version && data.gameName) {
            // Create a new custom game with the imported data
            const gameId = `custom-${Date.now()}`;
            const newGame = {
              id: gameId,
              name: data.gameName + ' (Imported)',
              items: data.items,
              settings: data.settings || defaultGameSettings,
              createdAt: new Date().toISOString()
            };
            
            setCustomGames([...customGames, newGame]);
            setItems(data.items);
            setGameSettings(prev => ({ ...prev, [gameId]: newGame.settings || defaultGameSettings }));
            setCurrentGame(gameId);
            
            if (data.completedItems && Array.isArray(data.completedItems)) {
              setCompletedItems(new Set(data.completedItems));
            }
            
            showNotification(`Imported game "${newGame.name}" successfully`, 'success');
          } else {
            // Legacy format - just load items
            setItems(data.items);
            
            if (data.completedItems && Array.isArray(data.completedItems)) {
              setCompletedItems(new Set(data.completedItems));
            }
            
            showNotification('Data imported successfully (legacy format)', 'success');
          }
        }
      } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
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
      <div className={`${isPanelCollapsed ? 'w-0' : 'w-96'} transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg overflow-hidden flex flex-col`}>
        <div className="w-96 p-6 flex flex-col h-full">
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Factory Calculator</h1>
            <div className="flex gap-1">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
                title={isDarkMode ? "Light mode" : "Dark mode"}
              >
                {isDarkMode ? <Sun size={20} className="text-gray-600 dark:text-gray-300" /> : <Moon size={20} className="text-gray-600" />}
              </button>
              <button 
                onClick={() => setIsPanelCollapsed(true)} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
                title="Hide panel"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          

          
          {/* Game Selection */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Gamepad2 size={14} className="inline mr-1" />
              Game Template
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={currentGame}
                onChange={(e) => setCurrentGame(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                {getAllAvailableGames().map(game => (
                  <option key={game.id} value={game.id}>
                    {game.name} {game.isCustom ? '★' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadGameTemplate(currentGame)}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
                title="Load game items"
              >
                Load
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGameManager(true)}
                className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition text-sm font-medium flex items-center gap-2"
              >
                <Edit2 size={14} />
                Manage Games
              </button>
              <button
                onClick={() => setShowGameSettings(true)}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2"
                title="Open Game Settings"
              >
                <Settings size={14} />
                Game Settings
              </button>
            </div>
          </div>

          {/* Resource Tree Filter */}
          {items.length > 0 && (
            <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Filter size={14} className="inline mr-1" />
                Resource Tree Filter
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={targetItem || itemSearchQuery}
                    onChange={(e) => {
                      setItemSearchQuery(e.target.value);
                      setTargetItem(null);
                      setShowItemDropdown(true);
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                    placeholder="Search and select item..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  {showItemDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {items
                        .filter(item => !itemSearchQuery || item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                        .map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTargetItem(item.name);
                              setItemSearchQuery('');
                              setShowItemDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-800 dark:text-gray-200 text-sm transition"
                          >
                            {item.name}
                          </button>
                        ))}
                      {items.filter(item => !itemSearchQuery || item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                          No items found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {targetItem && (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={targetFactoryCount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setTargetFactoryCount('');
                          } else {
                            const num = parseInt(value);
                            setTargetFactoryCount(isNaN(num) ? 1 : Math.max(1, num));
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setTargetFactoryCount(1);
                          }
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        min="1"
                        max="999"
                        step="1"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">factories</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={filterResourceTree}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium whitespace-nowrap"
                      >
                        {showResourceTree ? 'Update' : 'Show'} Tree
                      </button>
                      {showResourceTree && (
                        <button
                          onClick={() => {
                            setShowResourceTree(false);
                            calculate(); // Recalculate full tree
                          }}
                          className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition text-sm font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {showResourceTree && targetItem && (
                <div className="mt-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                  Showing tree for: {targetItem} ({targetFactoryCount} factories)
                </div>
              )}
            </div>
          )}
          
        </div>
        
        <div className="space-y-4 mb-6 flex-shrink-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
            <input
              type="text"
              value={currentItem.name}
              onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., iron_rod"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output</label>
              <input
                type="number"
                value={currentItem.output}
                onChange={(e) => setCurrentItem({ ...currentItem, output: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0.1"
                step="0.1"
              />
            </div>
            {!countsPerTimeUnit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time ({timeUnitLabel})</label>
                <input
                  type="number"
                  value={currentItem.time}
                  onChange={(e) => setCurrentItem({ ...currentItem, time: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0.1"
                  step="0.1"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Items</label>
            {currentItem.required.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={req.item}
                    onChange={(e) => { updateRequirement(index, 'item', e.target.value); setReqDropdownIndex(index); }}
                    onFocus={() => setReqDropdownIndex(index)}
                    onBlur={() => setTimeout(() => setReqDropdownIndex(null), 150)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Item name"
                  />

                  {reqDropdownIndex === index && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {items
                        .filter(item => !req.item || item.name.toLowerCase().includes(req.item.toLowerCase()))
                        .map((item2, idx) => (
                          <button
                            key={idx}
                            onMouseDown={(e) => e.preventDefault()} /* prevent input blur before click */
                            onClick={() => selectRequirementSuggestion(index, item2.name)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200 text-sm transition"
                          >
                            {item2.name}
                          </button>
                        ))}

                      {items.filter(item => !req.item || item.name.toLowerCase().includes(req.item.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">No items found</div>
                      )}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  value={req.count}
                  onChange={(e) => updateRequirement(index, 'count', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0.1"
                  step="0.1"
                />
                <button
                  onClick={() => removeRequirement(index)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))} 
            <button
              onClick={addRequirement}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
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
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteConfirmation(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Delete "{deleteConfirmation.itemName}"?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This item is referenced by {deleteConfirmation.referencingItems.length} other item{deleteConfirmation.referencingItems.length > 1 ? 's' : ''}:
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-3 mb-4 max-h-32 overflow-y-auto">
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {deleteConfirmation.referencingItems.map((name, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
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
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Manager Dialog */}
      {showGameManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGameManager(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Gamepad2 size={24} />
              Manage Games
            </h2>

            {/* Create New Game */}
            <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Create New Game</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && newGameName.trim() && createCustomGame()}
                  placeholder="Game name (e.g., Factorio, Dyson Sphere)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={createCustomGame}
                  disabled={!newGameName.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  Create Game (with current items)
                </button>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This will create a new game template with your current items. You can add/edit items later.
                </p>
              </div>
            </div>

            {/* Import/Export Game Data */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Import/Export Game Data</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportData}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
                >
                  <Download size={16} />
                  Export Current
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium cursor-pointer">
                  <Upload size={16} />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Export your current items or import from a file
              </p>
            </div>

            {/* Built-in Games */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Built-in Templates</h3>
              <div className="space-y-2">
                {getAvailableGames().map(game => (
                  <div key={game.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/30">
                    <Gamepad2 size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{game.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {game.id === GAMES.SATISFACTORY ? '80+ items included' : 'Empty template'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Games */}
            {customGames.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Your Custom Games</h3>
                <div className="space-y-2">
                  {customGames.map(game => (
                    <div key={game.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Gamepad2 size={16} className="text-teal-600 dark:text-teal-400" />
                      <div className="flex-1">
                        {editingGameId === game.id ? (
                          <input
                            type="text"
                            value={editingGameName}
                            onChange={(e) => setEditingGameName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                renameCustomGame(game.id, editingGameName);
                              } else if (e.key === 'Escape') {
                                setEditingGameId(null);
                                setEditingGameName('');
                              }
                            }}
                            onBlur={() => renameCustomGame(game.id, editingGameName)}
                            className="w-full px-2 py-1 border border-teal-300 dark:border-teal-600 rounded focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                            autoFocus
                          />
                        ) : (
                          <div className="font-medium text-gray-800 dark:text-gray-200">{game.name}</div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {game.items?.length || 0} items
                        </div>
                      </div>
                      {editingGameId !== game.id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingGameId(game.id);
                              setEditingGameName(game.name);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                            title="Rename game"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              loadGameTemplate(game.id);
                              setShowGameManager(false);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteCustomGame(game.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                            title="Delete game"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setShowGameManager(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200"
              >
                Close
              </button>
            </div>


          </div>
        </div>
      )}

      {showGameSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGameSettings(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[540px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Game Settings</h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exact Mode</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Use precise floats instead of rounding up factory counts</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={currentGameSetting.exactMode} onChange={(e) => updateCurrentGameSetting('exactMode', e.target.checked)} />
                  <div className={`w-11 h-6 rounded-full transition ${currentGameSetting.exactMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${currentGameSetting.exactMode ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Unit</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" value={currentGameSetting.timeUnit} onChange={(e)=> updateCurrentGameSetting('timeUnit', e.target.value)}>
                  <option value="s">Seconds (s)</option>
                  <option value="m">Minutes (m)</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{`Counts are per ${timeUnit === 'm' ? 'minute' : 'second'}`}</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{`Hide time field and treat outputs as per-${timeUnit === 'm' ? 'minute' : 'second'} counts`}</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={currentGameSetting.countsPerTimeUnit} onChange={(e) => updateCurrentGameSetting('countsPerTimeUnit', e.target.checked)} />
                  <div className={`w-11 h-6 rounded-full transition ${currentGameSetting.countsPerTimeUnit ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${currentGameSetting.countsPerTimeUnit ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t dark:border-gray-700">
              <button onClick={() => setShowGameSettings(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200">Close</button>
            </div>

          </div>
        </div>
      )}

      {/* Right Panel - Graph */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-950">
        {isPanelCollapsed && (
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={() => setIsPanelCollapsed(false)} 
              className="p-2 bg-white dark:bg-gray-800 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              title="Show panel"
            >
              <Menu size={20} />
            </button>
          </div>
        )}
        {isRightPanelCollapsed && (
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => setIsRightPanelCollapsed(false)} 
              className="p-2 bg-white dark:bg-gray-800 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              title="Show items panel"
            >
              <Menu size={20} />
            </button>
          </div>
        )}
        <div className={`absolute top-4 ${isRightPanelCollapsed ? 'right-20' : 'right-4'} flex gap-2 z-10`}>
          <button onClick={handleZoomIn} className="p-2 bg-white dark:bg-gray-800 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">
            <ZoomIn size={20} />
          </button>
          <button onClick={handleZoomOut} className="p-2 bg-white dark:bg-gray-800 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">
            <ZoomOut size={20} />
          </button>
        </div>

        {selectedItem && (
          <div className={`absolute top-4 ${isPanelCollapsed ? 'left-20' : 'left-4'} bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 z-10 max-w-sm`}>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{selectedItem}</div>
            {(() => {
              const displayResults = getFilteredResults();
              return displayResults && displayResults.factoryCount[selectedItem] && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Factories: {displayResults.factoryCount[selectedItem]}
                  </div>
                  {showResourceTree && targetItem && (
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      (Filtered for {targetItem})
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <svg
          ref={svgRef}
          className="w-full h-full cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => setContextMenu(null)}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <GraphVisualization 
              results={getFilteredResults()} 
              items={getFilteredItems()}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              onEditItem={openEditModal}
              completedItems={completedItems}
              onToggleCompletion={toggleItemCompletion}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              onCenterNode={centerOnNode}
              onAnimatePan={handleAnimatePan}
            />
          </g>
        </svg>

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="absolute bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-30"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-800 dark:text-gray-200"
              onClick={() => {
                toggleItemCompletion(contextMenu.itemName);
                setContextMenu(null);
              }}
            >
              {completedItems.has(contextMenu.itemName) ? (
                <>
                  <span className="text-gray-600 dark:text-gray-400">☐</span>
                  <span>Mark as Incomplete</span>
                </>
              ) : (
                <>
                  <span className="text-green-600 dark:text-green-400">☑</span>
                  <span>Mark as Complete</span>
                </>
              )}
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-800 dark:text-gray-200"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Edit Item</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output</label>
                    <input
                      type="number"
                      value={editForm.output}
                      onChange={(e) => setEditForm({ ...editForm, output: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  {!countsPerTimeUnit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time ({timeUnitLabel})</label>
                      <input
                        type="number"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Items</label>
                  {editForm.required.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={req.item}
                          onChange={(e) => { updateEditRequirement(index, 'item', e.target.value); setEditReqDropdownIndex(index); }}
                          onFocus={() => setEditReqDropdownIndex(index)}
                          onBlur={() => setTimeout(() => setEditReqDropdownIndex(null), 150)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Item name"
                        />

                        {editReqDropdownIndex === index && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {items
                              .filter(item => !req.item || item.name.toLowerCase().includes(req.item.toLowerCase()))
                              .map((item2, idx) => (
                                <button
                                  key={idx}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => selectEditRequirementSuggestion(index, item2.name)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200 text-sm transition"
                                >
                                  {item2.name}
                                </button>
                              ))}

                            {items.filter(item => !req.item || item.name.toLowerCase().includes(req.item.toLowerCase())).length === 0 && (
                              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">No items found</div>
                            )}
                          </div>
                        )}
                      </div>

                      <input
                        type="number"
                        value={req.count}
                        onChange={(e) => updateEditRequirement(index, 'count', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0.1"
                        step="0.1"
                      />
                      <button
                        onClick={() => removeEditRequirement(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addEditRequirement}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
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
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!results && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <div className="text-lg font-medium">Add items to see the production graph</div>
              <div className="text-sm mt-2">Items will auto-calculate and display here</div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Items List */}
      <div className={`${isRightPanelCollapsed ? 'w-0' : 'w-96'} transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg overflow-hidden flex flex-col`}>
        <div className="w-96 p-6 flex flex-col h-full">
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={() => setIsRightPanelCollapsed(true)} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
                title="Hide panel"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Items ({items.length})</h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="space-y-2 overflow-y-auto flex-1">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className={`border rounded-md p-2 cursor-pointer transition ${
                    selectedItem === item.name ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectItem(selectedItem === item.name ? null : item.name)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {countsPerTimeUnit ? `${item.output} per ${timeUnitLabel}` : `${item.output} in ${item.time} ${timeUnitLabel}`}
                    {item.required.length > 0 && ` • ${item.required.length} inputs`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function GraphVisualization({ results, items, selectedItem, onSelectItem, onEditItem, completedItems, onToggleCompletion, contextMenu, setContextMenu, onCenterNode, onAnimatePan }) {
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
        
        // Pan viewport during animation
        if (onAnimatePan) {
          if (selectedItem) {
            // Selecting: keep selected node in place
            const selectedNode = newNodes.find(n => n.id === selectedItem);
            if (selectedNode) {
              onAnimatePan(selectedNode.x, selectedNode.y, eased, false);
            }
          } else {
            // Deselecting: animate back to original pan position
            onAnimatePan(0, 0, eased, true);
          }
        }
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
          <polygon points="0 0, 10 3, 0 6" fill="#666" className="dark:fill-gray-400" />
        </marker>
        <marker
          id="arrowhead-dark"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
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
              stroke={isHighlighted ? "#3b82f6" : ""}
              className={!isHighlighted ? "stroke-gray-600 dark:stroke-gray-500" : ""}
              strokeWidth={isHighlighted ? 3 : 2}
              markerEnd="url(#arrowhead)"
              opacity={selectedItem && !isHighlighted ? 0.2 : 1}
            />
            {selectedItem && isHighlighted && (
              <>
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fontSize="12"
                  className="fill-white dark:fill-gray-900"
                  fontWeight="700"
                  strokeWidth="3"
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none' }}
                >
                  {link.factoriesForEdge !== null && link.factoriesForEdge !== undefined
                    ? (link.factoriesForEdge % 1 === 0 
                        ? `${link.factoriesForEdge} factories`
                        : `${link.factoriesForEdge.toFixed(2)} factories`)
                    : (link.perFactoryRate % 1 === 0 
                        ? `${link.perFactoryRate}/s`
                        : `${link.perFactoryRate.toFixed(2)}/s`)}
                </text>
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fontSize="12"
                  className="fill-black dark:fill-gray-100"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {link.factoriesForEdge !== null && link.factoriesForEdge !== undefined
                    ? (link.factoriesForEdge % 1 === 0 
                        ? `${link.factoriesForEdge} factories`
                        : `${link.factoriesForEdge.toFixed(2)} factories`)
                    : (link.perFactoryRate % 1 === 0 
                        ? `${link.perFactoryRate}/s`
                        : `${link.perFactoryRate.toFixed(2)}/s`)}
                </text>
              </>
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
              fill={isDeleted ? "#fecaca" : isPlaceholder ? "#fee2e2" : isCompleted ? "#d1fae5" : isSelected ? "#3b82f6" : ""}
              stroke={isDeleted ? "#b91c1c" : isPlaceholder ? "#dc2626" : isCompleted ? "#10b981" : isSelected ? "#2563eb" : ""}
              className={
                isDeleted ? "dark:fill-red-900/40 dark:stroke-red-700" :
                isPlaceholder ? "dark:fill-red-900/30 dark:stroke-red-800" :
                isCompleted ? "dark:fill-green-900/40 dark:stroke-green-700" :
                !isSelected ? "fill-white dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" : ""
              }
              strokeWidth={isDeleted ? "3" : "2"}
              strokeDasharray={isDeleted ? "5,3" : "none"}
              onClick={(e) => {
                e.stopPropagation();
                // Store node position info before selecting it
                if (!isSelected && onCenterNode) {
                  const posInfo = onCenterNode(node.x, node.y);
                  onSelectItem(isSelected ? null : node.id, posInfo);
                } else {
                  onSelectItem(isSelected ? null : node.id);
                }
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
              fill={isDeleted ? "#991b1b" : isPlaceholder ? "#dc2626" : isCompleted ? "#059669" : isSelected ? "#fff" : ""}
              className={
                isDeleted ? "dark:fill-red-400" :
                isPlaceholder ? "dark:fill-red-500" :
                isCompleted ? "dark:fill-green-400" :
                !isSelected ? "fill-gray-800 dark:fill-gray-100" : ""
              }
              style={{ pointerEvents: 'none', textDecoration: isDeleted ? 'line-through' : 'none' }}
            >
              {node.id}
            </text>
            <text
              textAnchor="middle"
              y="14"
              fontSize="11"
              fill={isDeleted ? "#991b1b" : isPlaceholder ? "#dc2626" : isCompleted ? "#059669" : isSelected ? "#dbeafe" : ""}
              className={
                isDeleted ? "dark:fill-red-400" :
                isPlaceholder ? "dark:fill-red-500" :
                isCompleted ? "dark:fill-green-400" :
                !isSelected ? "fill-gray-600 dark:fill-gray-400" : ""
              }
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