'use strict';

/**
 * Crafting Module - Handles crafting recipes and inventory management
 */

module.exports = function setupCrafting(bot, config, addLog) {
  const recipes = {};

  // Initialize common crafting recipes (2x2 and 3x3 patterns)
  function initRecipes() {
    // Wood to Planks
    recipes.planks = { inputs: ['oak_log'], output: 'oak_planks', amount: 4 };
    // Planks to Sticks
    recipes.sticks = { inputs: ['oak_planks', 'oak_planks'], output: 'stick', amount: 4 };
    // Sticks + Planks to Crafting Table
    recipes.crafting_table = {
      inputs: ['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks'],
      output: 'crafting_table',
      amount: 1
    };
    // Stone tools (need stone + sticks)
    recipes.stone_pickaxe = {
      inputs: ['stone', 'stone', 'stone', 'stick', 'stick', 'stick'],
      output: 'stone_pickaxe',
      amount: 1
    };
    // Torches (coal + sticks)
    recipes.torches = {
      inputs: ['coal', 'stick'],
      output: 'torch',
      amount: 4
    };
  }

  initRecipes();
  addLog('[Crafting] Crafting recipes initialized');

  function hasItems(itemNames) {
    if (!bot.inventory) return false;
    return itemNames.every(name => bot.inventory.findInventoryItem(name));
  }

  function craftItem(recipeName) {
    if (!recipes[recipeName]) {
      addLog(`[Crafting] Recipe not found: ${recipeName}`);
      return false;
    }

    const recipe = recipes[recipeName];
    if (!hasItems(recipe.inputs)) {
      addLog(`[Crafting] Missing items for ${recipeName}`);
      return false;
    }

    // Use crafting table from inventory
    const table = bot.inventory.findInventoryItem('crafting_table');
    if (table) {
      bot.equip(table, 'hand');
      // Place table (would need to place it to use)
    }

    addLog(`[Crafting] Crafting ${recipeName}...`);
    return true;
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
    craftItem,
    hasItems,
    recipes,
    getInventorySummary,
    initRecipes
  };
};
