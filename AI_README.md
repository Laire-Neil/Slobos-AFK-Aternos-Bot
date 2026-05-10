# Minecraft Survival AI Bot

An advanced autonomous Minecraft bot with survival, building, crafting, and mining capabilities!

## Features 🚀

### 🤖 Autonomous AI System
The bot now has a full survival AI that makes intelligent decisions:
- **State Machine**: Transitions between IDLE, GATHERING, CRAFTING, BUILDING, MINING, EXPLORING, and FLEEING states
- **Resource Management**: Automatically gathers wood, stone, and coal
- **Health & Hunger Management**: Eats when hungry, flees when health is low
- **Decision Making**: Prioritizes actions based on current needs

### 🏗️ Building System
- Constructs shelters automatically
- Builds towers for observation
- Places blocks intelligently
- Creates 3x3 structures with walls

### ⛏️ Mining System
- Autonomous resource gathering
- Finds and mines: stone, wood logs, coal, iron ore
- Smart prioritization of valuable resources
- Block detection and path planning

### 🔨 Crafting System
- Automated recipe management
- Crafts sticks, planks, tools, torches
- Inventory management
- Support for 2x2 and 3x3 crafting recipes

### 💪 Survival System
- Real-time health monitoring
- Hunger/food management
- Automatic eating
- Threat detection and fleeing
- Mob avoidance

### 🕷️ Advanced Features
- **Circle Walking**: Anti-AFK movement in patterns
- **Auto-Authentication**: Automatic login/register
- **Chat System**: Automated chat messages
- **Combat Module**: Optional combat abilities
- **Web Dashboard**: Real-time monitoring via HTTP

## Installation

```bash
cd Slobos-AFK-Aternos-Bot
npm install
```

### Requirements
- **Node.js**: v22 or higher
- **Minecraft Server**: 1.21.x with ViaVersion (for 26.1.2 support)

## Configuration

Edit `settings.json`:

```json
{
  "name": "AFK Bot",
  "bot-account": {
    "username": "YourBotName",
    "password": "",
    "type": "offline"
  },
  "server": {
    "ip": "your-server.com",
    "port": 25565,
    "version": ""
  },
  "modules": {
    "aiSurvival": true,
    "avoidMobs": true,
    "combat": true,
    "chat": true
  }
}
```

### AI Configuration Options

In `settings.json`, enable/disable AI features:

```json
"modules": {
  "aiSurvival": true,      // Enable autonomous AI
  "avoidMobs": true,       // Flee from dangerous mobs
  "combat": true,          // Enable combat
  "chat": true,            // Send chat messages
  "console-commands": true // Allow remote commands
}
```

## Running the Bot

### Local Development
```bash
npm start
# or
node index.js
```

### Web Dashboard
After starting, open: `http://localhost:5000`

- **Status**: Real-time connection status
- **Logs**: Live bot activity logs
- **Commands**: Send remote commands to the bot
- **Controls**: Start/stop the bot

### Monitoring Commands
```bash
# View bot position
/pos

# View connection status
/status

# View help
/help

# Send in-game chat
/say Hello world!
```

## AI Behavior Tree

The bot follows this decision-making process:

```
Every 3 seconds:
  ├─ Check Health
  │  └─ If critical: FLEE
  ├─ Check Hunger
  │  └─ If low: EAT
  ├─ Check Resources
  │  ├─ Low logs/stone → MINING
  │  └─ Low coal → GATHERING
  ├─ Check Building
  │  └─ If logs available → BUILDING (shelter)
  ├─ Check Crafting
  │  └─ If materials available → CRAFTING
  └─ Default → EXPLORING
```

## Module Files

- `modules/survival.js` - Health, hunger, threat management
- `modules/mining.js` - Block breaking and resource gathering
- `modules/crafting.js` - Recipe management and crafting
- `modules/building.js` - Structure construction
- `modules/aiState.js` - Main state machine and decision maker

## Advanced Features

### Custom Building
Enable custom structures:
```javascript
await bot.survivalAI.building.buildShelter();
await bot.survivalAI.building.buildTower(height);
```

### Resource Gathering
```javascript
const logs = bot.survivalAI.mining.findNearestBlock('oak_log', 128);
await bot.survivalAI.mining.mineBlock(logs);
```

### Inventory Management
```javascript
const inventory = bot.survivalAI.crafting.getInventorySummary();
console.log(inventory); // { oak_log: 32, stone: 16, ... }
```

## Troubleshooting

### "Unsupported protocol version 775"
**Solution**: Ensure ViaVersion, ViaBackwards, and ViaRewind are installed on your server.

### Bot not gathering resources
**Solution**: Check `/status` command in logs - ensure bot has spawned and has an inventory.

### Building not working
**Solution**: Bot needs wood logs in inventory. Ensure mining is enabled.

### Low frame rate or freezing
**Solution**: Reduce `circle-walk.speed` in settings.json or disable resource-intensive modules.

## Performance Tips

1. **Disable unused modules** in `settings.json`
2. **Increase AI decision interval** in `modules/aiState.js` (change 3000ms to higher)
3. **Limit search radius** for block finding (default: 128 blocks)
4. **Run on a dedicated machine** for best performance

## Contributing

Feel free to extend the AI with:
- Farming automation
- Fishing systems
- Trading with villagers
- Advanced navigation
- Dungeons exploration

## License

MIT - Feel free to use and modify!

## Support

For issues:
1. Check the logs in `/logs` endpoint
2. Review `settings.json` configuration
3. Ensure server has ViaVersion enabled
4. Check that bot has appropriate permissions

---

**Happy botting!** 🤖⛏️🏗️
