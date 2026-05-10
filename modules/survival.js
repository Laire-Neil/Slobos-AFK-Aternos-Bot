'use strict';

/**
 * Survival Module - Handles health, hunger, and threats
 */

module.exports = function setupSurvival(bot, config, addLog) {
  const HUNGER_THRESHOLD = 8;
  const HEALTH_THRESHOLD = 10;

  let lastEatTime = Date.now();
  const EAT_COOLDOWN = 2000;

  addLog('[Survival] Health and hunger monitor activated');

  // Monitor health
  bot.on('health', () => {
    const health = bot.health || 20;
    const hunger = bot.food || 20;
    if (health < HEALTH_THRESHOLD) {
      addLog(`[Survival] ⚠️  Low health: ${health}/20`);
    }
    if (hunger < HUNGER_THRESHOLD) {
      addLog(`[Survival] 🍖 Hunger: ${hunger}/20 - Eating...`);
      eatFood();
    }
  });

  function eatFood() {
    const now = Date.now();
    if (now - lastEatTime < EAT_COOLDOWN) return;
    lastEatTime = now;

    if (!bot.inventory || !bot.inventory.items) return;

    // Find food items in inventory (apple, bread, cooked meat, etc.)
    const foodItems = [
      'apple', 'bread', 'cooked_beef', 'cooked_pork', 'cooked_chicken',
      'baked_potato', 'carrot', 'golden_carrot', 'cooked_mutton', 'cooked_salmon'
    ];

    for (const foodName of foodItems) {
      const foodItem = bot.inventory.findInventoryItem(foodName);
      if (foodItem) {
        bot.equip(foodItem, 'hand');
        bot.activateItem();
        return;
      }
    }
  }

  // Dodge/flee from threats (creepers, zombies when low health)
  bot.on('entitySpotted', (entity) => {
    if (!entity || !entity.type) return;

    const threats = ['creeper', 'zombie', 'skeleton', 'spider', 'enderman'];
    const isThreat = threats.some(t => entity.type.includes(t));

    if (isThreat && bot.health < HEALTH_THRESHOLD) {
      addLog(`[Survival] ⚠️  Threat detected: ${entity.type} - Running away!`);
      // Move away from threat
      if (entity.position) {
        const away = entity.position.clone().subtract(bot.entity.position).normalize().scale(-15);
        bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalBlock)(
          entity.position.x + away.x,
          entity.position.y,
          entity.position.z + away.z
        ));
      }
    }
  });

  return {
    eatFood,
    getHealth: () => bot.health || 20,
    getHunger: () => bot.food || 20,
  };
};
