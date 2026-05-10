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

    // Priority: Always gather resources first on this gamemode
    const hasEnoughLogs = (inventory.oak_log || 0) > 16;
    const hasEnoughStone = (inventory.stone || 0) > 24;
    
    if (!hasEnoughLogs || !hasEnoughStone) {
      setState(states.MINING);
      return;
    }

    // Priority: Build shelter if we don't have one
    if (buildingAttempts < 1 && (inventory.oak_log || 0) > 12) {
      setState(states.BUILDING);
      return;
    }

    // If we have basic resources, practice crafting
    if ((inventory.oak_log || 0) > 8 && currentState !== states.CRAFTING) {
      setState(states.CRAFTING);
      return;
    }

    // Default to exploring to find more resources
    setState(states.EXPLORING);
  }

  let actionInterval = null;

  function startAI() {
    // Respect configuration: don't start AI if globally paused or aiSurvival disabled
    if (config && config.modules && (config.modules.pauseAll || (config.modules.disableActions && config.modules.disableActions.aiSurvival))) {
      addLog('[AI] startAI skipped - autonomous AI disabled by configuration');
      return;
    }

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
    if (target && target.position && bot && bot.pathfinder && bot.entity) {
      try {
        // Move to the resource first
        const GoalBlock = require('mineflayer-pathfinder').goals.GoalBlock;
        const dist = bot.entity.position.distanceTo(target.position);
        
        if (dist < 6) {
          // Close enough to mine
          mining.mineBlock(target);
        } else {
          // Move closer
          addLog(`[AI] Moving to resource (${Math.floor(dist)}m away)`);
          bot.pathfinder.setGoal(new GoalBlock(target.position.x, target.position.y, target.position.z), false);
        }
      } catch (err) {
        addLog(`[AI] Error navigating to resource: ${err.message}`);
        setState(states.EXPLORING);
      }
    } else {
      addLog(`[AI] No resources found nearby, exploring to find some...`);
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
    // Random walk in a direction
    if (!bot || !bot.entity || !bot.pathfinder) return;
    
    try {
      const dx = (Math.random() - 0.5) * 100;
      const dz = (Math.random() - 0.5) * 100;
      const pos = bot.entity.position;
      const targetPos = pos.clone().add(new (require('vec3'))(dx, 0, dz));
      
      const GoalBlock = require('mineflayer-pathfinder').goals.GoalBlock;
      bot.pathfinder.setGoal(new GoalBlock(Math.floor(targetPos.x), Math.floor(pos.y), Math.floor(targetPos.z)), false);
      
      addLog(`[AI] Exploring: moving to scan for resources...`);
    } catch (err) {
      // Fallback: just move in a random direction
      if (bot && bot.entity && bot.setControlState) {
        bot.setControlState('forward', Math.random() > 0.5);
      }
    }
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
