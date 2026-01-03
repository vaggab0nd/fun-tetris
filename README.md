# Fun Tetris Game

A lightweight, terminal-based Tetris implementation in Python - perfect for learning game development concepts!

## Features

- Classic Tetris gameplay with all 7 tetromino pieces (I, O, T, S, Z, J, L)
- Colorful terminal display using ANSI colors
- Progressive difficulty (speed increases with level)
- Score tracking and line clearing
- Hard drop and soft drop mechanics
- Clean, well-commented code for learning

## Requirements

- Python 3.6 or higher
- Unix/Linux terminal (uses termios for keyboard input)
- No external dependencies - uses only Python standard library!

## How to Play

1. Make the game executable:
   ```bash
   chmod +x tetris.py
   ```

2. Run the game:
   ```bash
   python3 tetris.py
   ```
   or
   ```bash
   ./tetris.py
   ```

## Controls

- **A** - Move piece left
- **D** - Move piece right
- **W** - Rotate piece clockwise
- **S** - Soft drop (move down faster)
- **SPACE** - Hard drop (instant drop)
- **P** - Pause/Resume game
- **Q** - Quit game

## Scoring System

- **Single line**: 100 points × level
- **Double lines**: 300 points × level
- **Triple lines**: 500 points × level
- **Tetris (4 lines)**: 800 points × level
- **Hard drop bonus**: 2 points per row dropped

## Learning Journey

This implementation demonstrates several programming concepts:

1. **Object-Oriented Programming**: Classes for Tetromino, TetrisGame, and TetrisUI
2. **Game Loop**: Continuous update and render cycle
3. **Collision Detection**: Checking valid piece positions
4. **Data Structures**: Using 2D lists for the game board
5. **Terminal Control**: ANSI color codes and screen clearing
6. **Input Handling**: Non-blocking keyboard input with termios

## Code Structure

- `Tetromino` class: Represents individual pieces with rotation logic
- `TetrisGame` class: Core game logic (movement, collision, scoring)
- `TetrisUI` class: Terminal rendering and display
- `main()`: Game loop and input handling

## Customization Ideas

Want to extend your learning? Try adding:

- [ ] High score persistence (save to file)
- [ ] Different game modes (marathon, sprint, ultra)
- [ ] Ghost piece (preview where piece will land)
- [ ] Hold piece functionality
- [ ] Sound effects (using pygame mixer or similar)
- [ ] Network multiplayer
- [ ] Different difficulty presets
- [ ] Custom color themes

## Troubleshooting

**Game not responding to input**: Make sure you're running on a Unix/Linux terminal that supports termios.

**Colors not showing**: Ensure your terminal supports ANSI color codes.

**Game too fast/slow**: You can adjust the `fall_speed` variable in the `main()` function.

## License

This is a learning project - feel free to modify, extend, and share!

## Have Fun!

Enjoy learning Python through game development. Try reading through the code, understanding each function, and experimenting with modifications!
