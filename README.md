# Fun Tetris Game

A lightweight Tetris implementation available in two versions - terminal-based Python and web-based HTML/JavaScript. Perfect for learning game development concepts!

## Two Versions Available

### 🐍 Python Terminal Version (`tetris.py`)
- Classic terminal-based gameplay
- ANSI color codes for colorful display
- Keyboard controls (A/D/W/S/Space)
- Great for learning Python and terminal programming

### 🌐 Web Version (`index.html`)
- Play in any browser (Chrome, Safari, Firefox, etc.)
- Mobile-friendly with touch controls
- Beautiful gradient UI with responsive design
- Perfect for playing on your phone
- Single HTML file - just open and play!

## Features

- Classic Tetris gameplay with all 7 tetromino pieces (I, O, T, S, Z, J, L)
- Colorful display (ANSI colors for terminal, Canvas for web)
- Progressive difficulty (speed increases with level)
- Score tracking and line clearing
- Hard drop and soft drop mechanics
- Clean, well-commented code for learning

## How to Play

### Web Version (Easiest - Works on Phone!)

1. **Option 1: Open Locally**
   - Simply open `index.html` in any web browser
   - Double-click the file or drag it into your browser

2. **Option 2: Host on GitHub Pages (Play from Anywhere!)**
   - Push to GitHub
   - Go to Settings → Pages
   - Enable GitHub Pages from your branch
   - Access from `https://yourusername.github.io/fun-tetris/`

3. **Option 3: Deploy to Lovable or Any Static Host**
   - Upload `index.html` to any static hosting service
   - Works on Netlify, Vercel, Lovable, etc.

4. **Option 4: Local Server**
   ```bash
   python3 -m http.server 8000
   # Then open http://localhost:8000 in your browser
   ```

**Web Controls:**
- **Arrow Keys** - Move left/right, rotate (up), soft drop (down)
- **Space** - Hard drop
- **Touch Buttons** - For mobile play (buttons shown on screen)

### Python Terminal Version

**Requirements:**
- Python 3.6 or higher
- Unix/Linux terminal (uses termios for keyboard input)
- No external dependencies!

**How to Run:**
```bash
chmod +x tetris.py
python3 tetris.py
```

**Terminal Controls:**
- **A/D** - Move left/right
- **W** - Rotate
- **S** - Soft drop
- **Space** - Hard drop
- **Q** - Quit

## Scoring System

- **Single line**: 100 points × level
- **Double lines**: 300 points × level
- **Triple lines**: 500 points × level
- **Tetris (4 lines)**: 800 points × level
- **Hard drop bonus**: 2 points per row dropped

## Learning Journey

This implementation demonstrates several programming concepts:

### Python Version (`tetris.py`)
1. **Object-Oriented Programming**: Classes for Tetromino, TetrisGame, and TetrisUI
2. **Game Loop**: Continuous update and render cycle
3. **Collision Detection**: Checking valid piece positions
4. **Data Structures**: Using 2D lists for the game board
5. **Terminal Control**: ANSI color codes and screen clearing
6. **Input Handling**: Non-blocking keyboard input with termios

### Web Version (`index.html`)
1. **HTML5 Canvas**: Drawing graphics in the browser
2. **JavaScript Game Loop**: Using `requestAnimationFrame` for smooth animation
3. **Event Handling**: Keyboard and touch event listeners
4. **CSS Flexbox/Grid**: Responsive layout design
5. **DOM Manipulation**: Updating UI elements dynamically
6. **Mobile-First Design**: Touch controls and responsive breakpoints

## Code Structure

### Python Version
- `Tetromino` class: Represents individual pieces with rotation logic
- `TetrisGame` class: Core game logic (movement, collision, scoring)
- `TetrisUI` class: Terminal rendering and display
- `main()`: Game loop and input handling

### Web Version
- Single HTML file with embedded CSS and JavaScript
- `Tetromino` class: Piece representation (same logic, different language!)
- Canvas rendering: Direct pixel manipulation for smooth graphics
- Event listeners: Keyboard and touch input handling
- Responsive design: Adapts to desktop and mobile screens

## Customization Ideas

Want to extend your learning? Try adding:

### For Both Versions
- [ ] Ghost piece (preview where piece will land)
- [ ] Hold piece functionality
- [ ] Different game modes (marathon, sprint, ultra)
- [ ] Custom color themes

### Python-Specific
- [ ] High score persistence (save to file with JSON)
- [ ] Terminal UI improvements (better borders, animations)
- [ ] Sound effects (using pygame mixer)

### Web-Specific
- [ ] High score with localStorage
- [ ] Sound effects (using Web Audio API)
- [ ] Animations and particle effects
- [ ] Progressive Web App (PWA) for offline play
- [ ] Leaderboard with backend API
- [ ] Social sharing (share your score!)
- [ ] Dark/light theme toggle

## Troubleshooting

### Python Version
**Game not responding to input**: Make sure you're running on a Unix/Linux terminal that supports termios.

**Colors not showing**: Ensure your terminal supports ANSI color codes.

**Game too fast/slow**: You can adjust the `fall_speed` variable in the `main()` function.

### Web Version
**Touch controls not working**: Make sure you're tapping the buttons directly (not the spaces between).

**Game too small on phone**: Try rotating your device or zooming the page.

**Not loading**: Make sure JavaScript is enabled in your browser.

## License

This is a learning project - feel free to modify, extend, and share!

## Have Fun!

Enjoy learning Python through game development. Try reading through the code, understanding each function, and experimenting with modifications!
