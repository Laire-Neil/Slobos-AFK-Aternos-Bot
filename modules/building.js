'use strict';

/**
 * Building Module - Constructs shelters and structures
 */

module.exports = function setupBuilding(bot, config, addLog, pathfinder, goals) {
  let isBuilding = false;

  addLog('[Building] Building system initialized');

  /**
   * Build a simple 3x3x2 shelter at current position
   */
  async function buildShelter() {
    if (isBuilding) {
      addLog('[Building] Already building');
      return false;
    }

    isBuilding = true;
    try {
      const pos = bot.entity.position.clone();
      const logs = bot.inventory.findInventoryItem('oak_log');

      if (!logs) {
        addLog('[Building] Need wood logs to build shelter');
        isBuilding = false;
        return false;
      }

      addLog(`[Building] 🏗️  Building shelter at (${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)})`);

      // Build 3x3 base
      const offsets = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
      ];

      for (const [dx, dz] of offsets) {
        const blockPos = pos.offset(dx, 0, dz);
        const block = bot.blockAt(blockPos);
        
        if (block && block.name !== 'oak_log') {
          await placeBlock(blockPos, 'oak_log');
          addLog(`[Building] Placed block at (${blockPos.x}, ${blockPos.y}, ${blockPos.z})`);
        }
      }

      // Build walls (height 2)
      for (const [dx, dz] of offsets) {
        for (let dy = 1; dy <= 2; dy++) {
          const wallPos = pos.offset(dx, dy, dz);
          const block = bot.blockAt(wallPos);
          
          if (!block || block.name === 'air') {
            await placeBlock(wallPos, 'oak_log');
          }
        }
      }

      addLog('[Building] ✓ Shelter built!');
      isBuilding = false;
      return true;
    } catch (err) {
      addLog(`[Building] Error building shelter: ${err.message}`);
      isBuilding = false;
      return false;
    }
  }

  async function placeBlock(position, blockType = 'oak_log') {
    try {
      if (!position || !bot || !bot.blockAt) return false;
      
      // Find block to place on
      const refBlock = bot.blockAt(position.offset ? position.offset(0, -1, 0) : position);
      if (!refBlock) return false;

      // Equip the block
      if (!bot.inventory || !bot.inventory.findInventoryItem) return false;
      const item = bot.inventory.findInventoryItem(blockType);
      if (!item) return false;

      bot.equip(item, 'hand');
      
      // Place block
      const Vec3 = require('vec3');
      await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Build a simple tower for observation
   */
  async function buildTower(height = 5) {
    if (isBuilding) return false;
    
    isBuilding = true;
    try {
      const pos = bot.entity.position.clone();
      addLog(`[Building] Building tower (height: ${height})`);

      for (let i = 0; i < height; i++) {
        const blockPos = pos.offset(0, i, 0);
        await placeBlock(blockPos, 'oak_log');
        addLog(`[Building] Tower level ${i + 1}/${height}`);
      }

      addLog('[Building] ✓ Tower complete!');
      isBuilding = false;
      return true;
    } catch (err) {
      addLog(`[Building] Error building tower: ${err.message}`);
      isBuilding = false;
      return false;
    }
  }

  return {
    buildShelter,
    buildTower,
    placeBlock,
    isBuilding: () => isBuilding
  };
};
