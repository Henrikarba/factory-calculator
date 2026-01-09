/**
 * Factory Calculator - Core Calculation Logic
 * 
 * Key principle: Ceil values DURING calculation, not after.
 * You can't split factories in half, so if 2 factories each need 0.3 of a resource,
 * that's ceil(0.3) + ceil(0.3) = 2, NOT ceil(0.6) = 1.
 */

/**
 * Calculate factory requirements for all items using spider web approach
 * Processes items only after ALL their consumers have been calculated
 * @param {Array} items - Array of all item definitions with their recipes
 * @param {Boolean} exactMode - If true, use exact floats; if false, ceil values
 * @returns {Object} - Map of item names to factory counts, edge contributions, and final products
 */
export function calculateFactoryRequirements(items, exactMode = false) {
  // Build dependency graph
  const itemMap = new Map();
  items.forEach(item => itemMap.set(item.name, item));
  
  const consumers = {}; // item -> list of items that need it
  const consumerCount = {}; // item -> how many items need it
  
  items.forEach(item => {
    consumers[item.name] = [];
    consumerCount[item.name] = 0;
  });
  
  items.forEach(item => {
    if (item.required) {
      item.required.forEach(req => {
        if (req.item && consumers[req.item]) {
          consumers[req.item].push(item.name);
          consumerCount[req.item]++;
        }
      });
    }
  });
  
  // Find final products (items with 0 consumers)
  const finalProducts = items
    .filter(item => consumerCount[item.name] === 0)
    .map(item => item.name);
  
  const factoryCount = {};
  const edgeContributions = {};
  const remainingConsumers = { ...consumerCount }; // Track unprocessed consumers
  
  // Start with final products (1 factory each)
  const ready = [...finalProducts];
  finalProducts.forEach(productName => {
    factoryCount[productName] = 1;
  });
  
  console.log('\n=== Spider Web Calculation ===');
  console.log('Mode:', exactMode ? 'EXACT (floats)' : 'CEILING (rounded up)');
  console.log('Final products:', finalProducts);
  
  while (ready.length > 0) {
    const itemName = ready.shift();
    
    const item = itemMap.get(itemName);
    if (!item || !item.required || item.required.length === 0) continue;
    
    // This item is fully calculated - process its dependencies
    const totalFactories = factoryCount[itemName] || 0;
    
    console.log(`\n=== Processing ${itemName} (${totalFactories} factories) ===`);
    
    item.required.forEach(req => {
      if (!req.item || req.item === '') return;
      
      const inputItem = itemMap.get(req.item);
      if (!inputItem) return;
      
      const inputRate = inputItem.output / inputItem.time;
      const consumptionRatePerFactory = req.count / item.time;
      const factoriesPerFactory = consumptionRatePerFactory / inputRate;
      
      // Calculate total as float
      const totalFactoriesFloat = factoriesPerFactory * totalFactories;
      // Apply ceiling only if not in exact mode
      const totalFactoriesNeeded = exactMode ? totalFactoriesFloat : Math.ceil(totalFactoriesFloat);
      
      // Store edge contribution
      const edgeKey = `${req.item}->${itemName}`;
      edgeContributions[edgeKey] = totalFactoriesNeeded;
      
      console.log(`  ${req.item}: ${req.count}/${item.time}s = ${consumptionRatePerFactory.toFixed(3)}/s per factory`);
      console.log(`    Produces: ${inputItem.output}/${inputItem.time}s = ${inputRate.toFixed(3)}/s`);
      console.log(`    Need: ${factoriesPerFactory.toFixed(3)} × ${totalFactories} = ${totalFactoriesFloat.toFixed(3)} ${exactMode ? '(exact)' : `→ ceil to ${totalFactoriesNeeded}`}`);
      
      // Add to input's total factory count
      if (!factoryCount[req.item]) {
        factoryCount[req.item] = 0;
      }
      factoryCount[req.item] += totalFactoriesNeeded;
      
      // Mark this consumer as processed for the input item
      remainingConsumers[req.item]--;
      
      // If ALL consumers of the input are now processed, it's ready
      if (remainingConsumers[req.item] === 0 && !ready.includes(req.item)) {
        ready.push(req.item);
        console.log(`  → ${req.item} is now ready (all consumers processed, total: ${factoryCount[req.item]})`);
      }
    });
  }
  
  console.log('\n=== Final Results ===');
  console.log('Factory counts:', factoryCount);
  console.log('Edge contributions:', edgeContributions);
  
  return { factoryCount, edgeContributions, finalProducts };
}

/**
 * Calculate the number of factories needed along each edge (connection between items)
 * This is useful for visualizing the flow in a graph
 * @param {string} targetItem - The final product item name
 * @param {number} targetCount - Number of factories of the final product
 * @param {Array} items - Array of all item definitions
 * @returns {Array} - Array of edges with factory counts
 */
export function calculateEdgeFactories(targetItem, targetCount, items) {
  const itemMap = new Map();
  items.forEach(item => {
    itemMap.set(item.name, item);
  });

  const edges = [];
  const processedEdges = new Map(); // Track edges to aggregate multiple connections

  function calculateRecursive(itemName, count, parentName = null) {
    const item = itemMap.get(itemName);
    if (!item) return;

    // If there's a parent, record the edge
    if (parentName) {
      const edgeKey = `${parentName}->${itemName}`;
      const existing = processedEdges.get(edgeKey);
      if (existing) {
        existing.count += count;
      } else {
        const edge = {
          from: parentName,
          to: itemName,
          count: count
        };
        processedEdges.set(edgeKey, edge);
      }
    }

    if (!item.required || item.required.length === 0) return;

    item.required.forEach(req => {
      if (!req.item || req.item === '') return;

      const inputItem = itemMap.get(req.item);
      if (!inputItem) return;

      const outputRate = item.output / item.time;
      const inputRate = inputItem.output / inputItem.time;
      const consumptionRate = req.count / item.time;
      const factoriesNeeded = consumptionRate / inputRate;
      const totalFactoriesNeeded = Math.ceil(factoriesNeeded * count);

      calculateRecursive(req.item, totalFactoriesNeeded, itemName);
    });
  }

  calculateRecursive(targetItem, targetCount);

  // Convert map to array
  return Array.from(processedEdges.values());
}

/**
 * Calculate the per-factory production rate for an item
 * @param {Object} item - Item definition
 * @returns {number} - Items per second produced by one factory
 */
export function calculatePerFactoryRate(item) {
  if (!item || !item.time) return 0;
  return item.output / item.time;
}

/**
 * Calculate total production rate given factory counts
 * @param {string} itemName - Item to calculate for
 * @param {number} factoryCount - Number of factories
 * @param {Array} items - All item definitions
 * @returns {number} - Total items per second
 */
export function calculateTotalProductionRate(itemName, factoryCount, items) {
  const item = items.find(i => i.name === itemName);
  if (!item) return 0;
  return calculatePerFactoryRate(item) * factoryCount;
}

/**
 * Verify if factory setup meets requirements (no bottlenecks)
 * @param {Object} factoryCount - Map of factory counts
 * @param {Array} items - All item definitions
 * @returns {Object} - Analysis of bottlenecks and efficiency
 */
export function analyzeBottlenecks(factoryCount, items) {
  const itemMap = new Map();
  items.forEach(item => itemMap.set(item.name, item));

  const analysis = {};

  Object.keys(factoryCount).forEach(itemName => {
    const item = itemMap.get(itemName);
    if (!item || !item.required || item.required.length === 0) {
      analysis[itemName] = { status: 'raw_resource', balanced: true };
      return;
    }

    const myFactories = factoryCount[itemName];
    const myProductionRate = calculatePerFactoryRate(item) * myFactories;

    const requirements = [];
    let hasBottleneck = false;

    item.required.forEach(req => {
      if (!req.item || req.item === '') return;

      const inputItem = itemMap.get(req.item);
      if (!inputItem) return;

      const inputFactories = factoryCount[req.item] || 0;
      const inputProductionRate = calculatePerFactoryRate(inputItem) * inputFactories;
      const requiredRate = (req.count / item.time) * myFactories;

      const efficiency = inputProductionRate / requiredRate;

      requirements.push({
        item: req.item,
        required: requiredRate,
        available: inputProductionRate,
        efficiency: efficiency,
        bottleneck: efficiency < 0.99 // Allow 1% tolerance for rounding
      });

      if (efficiency < 0.99) hasBottleneck = true;
    });

    analysis[itemName] = {
      status: hasBottleneck ? 'bottleneck' : 'balanced',
      balanced: !hasBottleneck,
      requirements
    };
  });

  return analysis;
}
