'use strict';

/**
 * Mining Module - Handles resource gathering and block breaking
 */

module.exports = function setupMining(bot, config, addLog) {
  const priorityBlocks = ['stone', 'oak_log', 'coal_ore', 'iron_ore', 'dirt'];
  let isMining = false;

  addLog('[Mining] Mining system initialized');

  async function mineBlock(block) {
    if (!block || !block.position || !block.name) {
      addLog(`[Mining] No valid block to mine`);
      return false;
    }
    
    try {
      isMining = true;
      addLog(`[Mining] Mining ${block.name}`);
      
      await bot.dig(block);
      addLog(`[Mining] ✓ Mined ${block.name}`);
      isMining = false;
      return true;
    } catch (err) {
      addLog(`[Mining] ✗ Error mining: ${err.message}`);
      isMining = false;
      return false;
    }
  }

  function findNearestBlock(blockName, maxDistance = 64) {
    try {
      if (!bot || !bot.entity) return null;
      
      const pos = bot.entity.position;
      let closest = null;
      let closestDist = maxDistance + 1;
      
      // Manually scan nearby blocks using blockAt()
      const checkDistance = Math.min(maxDistance, 32); // Limit to 32 for performance
      
      for (let dx = -checkDistance; dx <= checkDistance; dx++) {
        for (let dy = -checkDistance; dy <= checkDistance; dy++) {
          for (let dz = -checkDistance; dz <= checkDistance; dz++) {
            try {
              const blockPos = pos.offset(dx, dy, dz);
              const block = bot.blockAt(blockPos);
              
              if (block && block.name && block.name !== 'air') {
                // Check if this block type is useful
                const isUseful = block.name.includes('stone') || 
                               block.name.includes('log') || 
                               block.name.includes('ore') ||
                               block.name.includes('wood') ||
                               block.name.includes('deepslate') ||
                               block.name.includes('dirt') ||
                               block.name.includes('cobblestone');
                
                if (isUseful) {
                  const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dz); // Manhattan distance
                  if (dist < closestDist) {
                    closest = block;
                    closestDist = dist;
                  }
                }
              }
            } catch (e) {
              // Skip this block if error
            }
          }
        }
      }
      
      if (closest) {
        addLog(`[Mining] Found ${closest.name} nearby`);
      }
      return closest;
    } catch (err) {
      return null;
    }
  }

  function gatherResources(targetCount = 64) {
    const inventory = getInventorySummary();
    
    // Priority: collect logs first (for crafting)
    if ((inventory.oak_log || 0) < targetCount / 4) {
      const logBlock = findNearestBlock('oak_log', 200);
      if (logBlock && logBlock.position) {
        addLog(`[Mining] Target: oak_log at distance`);
        return logBlock;
      }
    }

    // Then stone (most important)
    if ((inventory.stone || 0) < targetCount / 2) {
      const stoneBlock = findNearestBlock('stone', 200);
      if (stoneBlock && stoneBlock.position) {
        addLog(`[Mining] Target: stone at distance`);
        return stoneBlock;
      }
    }

    // Then coal for torches
    if ((inventory.coal || 0) < targetCount / 8) {
      const coalBlock = findNearestBlock('coal_ore', 200);
      if (coalBlock && coalBlock.position) {
        addLog(`[Mining] Target: coal at distance`);
        return coalBlock;
      }
    }

    addLog(`[Mining] No priority resources found. Inventory: ${JSON.stringify(inventory)}`);
    return null;
  }

  function getInventorySummary() {
    if (!bot.inventory || !bot.inventory.items) return {};
    const summary = {};
    bot.inventory.items().forEach(item => {
      summary[item.name] = (summary[item.name] || 0) + item.count;
    });
    return summary;
  }

  return {
    mineBlock,
    findNearestBlock,
    gatherResources,
    getInventorySummary,
    isMining: () => isMining
  };
};
