# Factory calculator

It is to calculate factory counts in factory games.

It stores all data in browser local storage so be sure to export the data after you have finished editing.

## Features

### Game Templates
- **Satisfactory**: Pre-loaded with all items and recipes from Satisfactory 1.1 (not up to date yet)
- **Default**: Build your own custom factory chains
- **Create Your Own Games**: Add unlimited custom game templates for any factory game

### Game Management
- Create custom game templates for any game or irl, you know your factories best
- Each game stores its own complete set of items and recipes
- Switch between games instantly
- Update game templates as you refine your recipes

### Resource Tree Filter
Select a target item and specify how many factories you want, and the calculator will:
- Show only the resources needed for that specific item
- Calculate scaled requirements based on your desired factory count
- Display a filtered dependency tree showing just what you need

### Exact Mode
Toggle between two calculation modes:
- **Ceiling Mode** (default): Rounds up factory counts (can't split factories)
- **Exact Mode**: Uses precise float values for perfect resource balancing

### Game Storage
- All items are saved directly to game templates
- No separate save/load system needed
- Switch between games and your items are automatically there
- Import/Export for sharing configurations or backing up your data

## Usage

### Creating Your Own Game Templates
1. Add all the items and recipes for your game (e.g., Factorio)
2. Click "Manage Games"
3. Enter a name for your game (e.g., "Factorio")
4. Click "Create Game"
5. Your current items are now saved as a game template!

### Switching Between Games
1. Use the Game Template dropdown to select any game
2. Click "Load" to load that game's items
3. For custom games, you can click "Update Game" to save changes

### Quick Start with Satisfactory
1. Select "Satisfactory" from the Game Template dropdown
2. Click "Load" to populate all Satisfactory items
3. Use the Resource Tree Filter to focus on specific items

### Custom Factory Chains
1. Select "Default" game mode
2. Add items manually with their production requirements
3. Build your factory network

### Resource Tree Filter
1. Load or create your factory network
2. In the Resource Tree Filter section:
   - Select your target item from the dropdown
   - Enter how many factories you want for that item
   - Click "Show Tree" to filter the view
3. The graph will now show only the resources needed for your target item, scaled to your factory count

### Calculation Method

**Ceiling Mode (Default):**
It is not most optimal, but it gives per resource factory counts.

So you can have something making iron for example, and it will calculate how many iron factories you need to produce the needed amount of iron rods.

If iron rods are produced from 7.5 iron factories and iron plates are produced from 5.5 iron factories, it will give you 14 iron factories total not 13.

It is like this so you would not need to have productions for rods and plates in the same place.

**Exact Mode:**
Toggle on "Exact Mode" to use precise float calculations. This gives you exact factory requirements (e.g., 7.5 + 5.5 = 13.0 factories) for perfect resource balancing when you can distribute production across locations.

## Examples

### Example: Building Computers in Satisfactory
1. Load Satisfactory template
2. Select "Computer" as target item
3. Set factory count to 10
4. Click "Show Tree"
5. The calculator shows exactly what resources you need to have 10 Computer factories running