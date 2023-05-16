# alt:V Server developer tools

## Tools include:
- Powerful in-game code editor
- Model inspector
- Fly
- Freecam
- Teleport to the map waypoint

### Code editor

![Code editor](./.github/codeeditor.png)
![Code editor themes](./.github/codeeditor2.png)

In-game code editor allows you to execute some JS code on client- or server- side directly in the game, while having autocompletion, hints, and so on.

Features:
- Resizable and movable window
- File persistence (files are saved in the local storage, so they don't reset after a reconnect/server restart)
- Autocompletion with the newest typings (dynamically downloaded from the typings repo)
- Ability to use code editor with keybinds only (Press <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>/</kbd> to see all the keybinds)
- Autocompletion snippets (Press <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>'</kbd> to see all the autocompletion snippets)
- Allows using top level await
- Shows all code's logs (even with colors!) and the return value in the editor
- Has half-transparent mode (<kbd>F5</kbd>)
- Is pretty customizable, has a plenty of editor themes

### Model inspector

![Model inspector](./.github/modelinspector.png)

Model inspector allows you to get basic information about the entity

Features:
- Ability to select entity via crosshair or a cursor (<kbd>F2</kbd>)
- Shows model boundaries
- If the entity is alt:V Entity, shows its type and id

### Fly

Features:
- Third person fly available
- Holding <kbd>Shift</kbd> while entering fly will enable freecam
- Leaving fly will teleport you to the ground (unless you're holding <kbd>Space</kbd>)
- You can change speed by scrolling mouse wheel
- <kbd>Q</kbd> - Fly Down, <kbd>E</kbd> - Fly Up
- Hold <kbd>Ctrl</kbd> - Slow down, Hold <kbd>Shift</kbd> - speed up

## Keybinds

### Global

<kbd>F2</kbd> - Toggle cursor<br>
<kbd>F3</kbd> - Model inspector<br>
<kbd>F4</kbd> - Fly<br>
<kbd>Space</kbd> <kbd>F4</kbd> - Leave fly without teleportation to the ground<br>
<kbd>Shift</kbd> <kbd>F4</kbd> - Freecam<br>
<kbd>F5</kbd> - Code editor half-transparent mode<br>
<kbd>F6</kbd> - Code editor<br>
<kbd>F9</kbd> - Teleport to a waypoint on a map<br>

### Code editor


<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>N</kbd> - Create client file<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>B</kbd> - Create server file<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>D</kbd> - Delete current file<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>R</kbd> - Rename current file<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>F</kbd> - Focus editor<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>↑ (Arrow up)</kbd> - Previous file<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>↓ (Arrow down)</kbd> - Next file<br>
<kbd>F7</kbd> or <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>E</kbd> - Execute code<br>
<kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>'</kbd> - Snippets list<br>

## Build

1. `yarn install`
2. `yarn build`
