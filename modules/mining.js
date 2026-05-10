'use strict';

/**
 * Mining Module - Handles resource gathering and block breaking
 */

module.exports = function setupMining(bot, config, addLog) {
  const priorityBlocks = ['stone', 'oak_log', 'coal_ore', 'iron_ore', 'dirt'];
  let isMining = false;

  addLog('[Mining] Mining system initialized');

  async function mineBlock(block) {
    if (!block) return false;
    
    try {
      isMining = true;
      addLog(`[Mining] Mining ${block.name} at (${Math.floor(block.position.x)}, ${Math.floor(block.position.y)}, ${Math.floor(block.position.z)})`);
      
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
    const blocks = bot.findBlocks({
      matching: (block) => block.name === blockName,
      maxDistance: maxDistance,
      count: 1
    });
    return blocks.length > 0 ? blocks[0] : null;
  }

  function gatherResources(targetCount = 64) {
    const inventory = getInventorySummary();
    
    // Priority: collect logs first (for crafting)
    if ((inventory.oak_log || 0) < targetCount / 4) {
      const logBlock = findNearestBlock('oak_log', 128);
      if (logBlock) return logBlock;
    }

    // Then coal for torches
    if ((inventory.coal || 0) < targetCount / 8) {
      const coalBlock = findNearestBlock('coal_ore', 128);
      if (coalBlock) return coalBlock;
    }

    // Then stone
    if ((inventory.stone || 0) < targetCount / 4) {
      const stoneBlock = findNearestBlock('stone', 128);
      if (stoneBlock) return stoneBlock;
    }

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
