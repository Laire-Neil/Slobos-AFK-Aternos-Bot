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
      if (!bot || !bot.findBlocks) return null;
      
      // Also search for variations (stone, stone_bricks, deepslate, etc.)
      const variations = [
        blockName,
        blockName.replace('_ore', ''),
        'stone', 'deepslate', 'cobblestone',
        'oak_log', 'birch_log', 'spruce_log',
        'coal_ore', 'copper_ore', 'iron_ore'
      ];

      for (const variant of variations) {
        try {
          const blocks = bot.findBlocks({
            matching: (block) => block && block.name && block.name.includes(variant),
            maxDistance: maxDistance,
            count: 1
          });
          if (blocks && blocks.length > 0) {
            addLog(`[Mining] Found block: ${blocks[0].name}`);
            return blocks[0];
          }
        } catch (e) {
          // Try next variant
        }
      }
      return null;
    } catch (err) {
      addLog(`[Mining] Error finding blocks: ${err.message}`);
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
