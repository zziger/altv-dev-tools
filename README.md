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
- Ability to use code editor with keybinds only (Ctrl + Alt + / to see all the keybinds)
- Autocompletion snippets (Ctrl + Alt + ' to see all the autocompletion snippets)
- Allows using top level await
- Shows all code's logs (even with colors!) and the return value in the editor
- Has half-transparent mode (F5)
- Is pretty customizable, has a plenty of editor themes

### Model inspector

![Model inspector](./.github/modelinspector.png)

Model inspector allows you to get basic information about the entity

Features:
- Ability to select entity via crosshair or a cursor (F2)
- Shows model boundaries
- If the entity is alt:V Entity, shows its type and id

### Fly

Features:
- Third person fly available
- Holding Shift while entering fly will enable freecam
- Leaving fly will teleport you to the ground (unless you're holding space)
- You can change speed by scrolling mouse wheel
- Q - Fly Down, E - Fly Up
- Hold Ctrl - Slow down, Hold Shift - speed up

## Keybinds

### Global

`F2` - Toggle cursor<br>
`F3` - Model inspector<br>
`F4` - Fly<br>
`Space + F4` - Leave fly without teleportation to the ground<br>
`Shift + F4` - Freecam<br>
`F5` - Code editor half-transparent mode<br>
`F6` - Code editor<br>
`F9` - Teleport to a waypoint on a map<br>

### Code editor

`Ctrl + Alt + N` - Create client file<br>
`Ctrl + Alt + B` - Create server file<br>
`Ctrl + Alt + D` - Delete current file<br>
`Ctrl + Alt + R` - Rename current file<br>
`Ctrl + Alt + F` - Focus editor<br>
`Ctrl + Alt + Arrow up` - Previous file<br>
`Ctrl + Alt + Arrow down` - Next file<br>
`F7 or Ctrl + Alt + E` - Execute code<br>
`Ctrl + Alt + '` - Snippets list<br>

## Build

1. `yarn install`
2. `yarn build`