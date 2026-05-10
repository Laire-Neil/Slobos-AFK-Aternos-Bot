'use strict';

/**
 * AI State Machine - Main decision maker for bot behavior
 * States: IDLE, GATHERING, CRAFTING, BUILDING, MINING, EXPLORING, FLEEING
 */

module.exports = function setupAI(bot, config, addLog, modules) {
  const states = {
    IDLE: 'IDLE',
    GATHERING: 'GATHERING',
    CRAFTING: 'CRAFTING',
    BUILDING: 'BUILDING',
    MINING: 'MINING',
    EXPLORING: 'EXPLORING',
    FLEEING: 'FLEEING'
  };

  let currentState = states.IDLE;
  let lastStateChange = Date.now();
  let buildingAttempts = 0;

  const { survival, mining, crafting, building } = modules;

  addLog('[AI] Autonomous AI system activated');
  addLog('[AI] States: IDLE → GATHERING → CRAFTING → BUILDING');

  function setState(newState) {
    if (currentState !== newState) {
      addLog(`[AI] State change: ${currentState} → ${newState}`);
      currentState = newState;
      lastStateChange = Date.now();
    }
  }

  function decideNextAction() {
    const health = survival.getHealth();
    const hunger = survival.getHunger();
    const inventory = crafting.getInventorySummary();

    // If health is critical, gather resources and seek shelter
    if (health < 5) {
      setState(states.FLEEING);
      return;
    }

    // If hungry, eat
    if (hunger < 8) {
      survival.eatFood();
    }

    // Priority: Build shelter if we don't have one
    if (buildingAttempts < 1 && (inventory.oak_log || 0) > 20) {
      setState(states.BUILDING);
      return;
    }

    // Check if we need more resources
    const hasEnoughLogs = (inventory.oak_log || 0) > 32;
    const hasEnoughStone = (inventory.stone || 0) > 32;
    const hasCoal = (inventory.coal || 0) > 8;

    if (!hasEnoughLogs || !hasEnoughStone) {
      setState(states.MINING);
      return;
    }

    // If we have basic resources, practice crafting
    if ((inventory.oak_log || 0) > 16 && currentState !== states.CRAFTING) {
      setState(states.CRAFTING);
      return;
    }

    // Default to exploring
    setState(states.EXPLORING);
  }

  let actionInterval = null;

  function startAI() {
    addLog('[AI] Starting autonomous behavior loop...');
    
    actionInterval = setInterval(() => {
      if (!bot || !bot.entity) return;

      decideNextAction();

      switch (currentState) {
        case states.BUILDING:
          executeBuilding();
          break;
        case states.MINING:
          executeMining();
          break;
        case states.GATHERING:
          executeGathering();
          break;
        case states.CRAFTING:
          executeCrafting();
          break;
        case states.EXPLORING:
          executeExploring();
          break;
        case states.IDLE:
          // Just stand around
          break;
      }
    }, 3000); // Check state every 3 seconds
  }

  function executeBuilding() {
    if (building.isBuilding()) return;

    if (buildingAttempts === 0) {
      building.buildShelter().then(success => {
        if (success) {
          buildingAttempts++;
          addLog(`[AI] Shelter built successfully`);
          setState(states.IDLE);
        } else {
          addLog(`[AI] Building failed, need more resources`);
          setState(states.MINING);
        }
      }).catch(err => {
        addLog(`[AI] Building error: ${err.message}`);
        setState(states.MINING);
      });
    }
  }

  function executeMining() {
    if (mining.isMining()) return;

    const target = mining.gatherResources(64);
    if (target && target.position) {
      mining.mineBlock(target);
    } else {
      addLog(`[AI] No resources found nearby, switching to EXPLORING`);
      setState(states.EXPLORING);
    }
  }

  function executeGathering() {
    const logBlock = mining.findNearestBlock('oak_log', 128);
    if (logBlock) {
      // Move to block
      addLog(`[AI] Moving to gather resources...`);
    } else {
      setState(states.EXPLORING);
    }
  }

  function executeCrafting() {
    const inventory = crafting.getInventorySummary();
    
    // Try to craft sticks
    if ((inventory.oak_planks || 0) > 2) {
      crafting.craftItem('sticks');
    }
    // Try to craft planks
    if ((inventory.oak_log || 0) > 0) {
      crafting.craftItem('planks');
    }
    
    setState(states.IDLE);
  }

  function executeExploring() {
    // Random walk
    const dx = (Math.random() - 0.5) * 50;
    const dz = (Math.random() - 0.5) * 50;
    const targetPos = bot.entity.position.clone().add(new (require('vec3'))(dx, 0, dz));
    
    addLog(`[AI] Exploring towards (${Math.floor(targetPos.x)}, ${Math.floor(targetPos.z)})`);
  }

  function stopAI() {
    if (actionInterval) {
      clearInterval(actionInterval);
      actionInterval = null;
      addLog('[AI] Autonomous AI stopped');
    }
  }

  function getState() {
    return {
      current: currentState,
      uptime: Math.floor((Date.now() - lastStateChange) / 1000),
      buildingAttempts
    };
  }

  return {
    startAI,
    stopAI,
    getState,
    setState,
    decideNextAction,
    states
  };
};
