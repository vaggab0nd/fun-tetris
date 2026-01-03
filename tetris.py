#!/usr/bin/env python3
"""
Fun Tetris Game - A lightweight terminal-based Tetris implementation
Perfect for learning Python game development concepts!
"""

import random
import sys
import os
import time
from typing import List, Tuple

# Game Constants
BOARD_WIDTH = 10
BOARD_HEIGHT = 20
EMPTY = 0

# Tetromino shapes (represented as list of coordinates relative to center)
SHAPES = {
    'I': [(0, -1), (0, 0), (0, 1), (0, 2)],
    'O': [(0, 0), (0, 1), (1, 0), (1, 1)],
    'T': [(0, 0), (-1, 0), (1, 0), (0, 1)],
    'S': [(0, 0), (1, 0), (0, 1), (-1, 1)],
    'Z': [(0, 0), (-1, 0), (0, 1), (1, 1)],
    'J': [(0, 0), (0, -1), (0, 1), (-1, 1)],
    'L': [(0, 0), (0, -1), (0, 1), (1, 1)]
}

# Colors for different pieces (using ANSI color codes)
COLORS = {
    'I': '\033[96m',  # Cyan
    'O': '\033[93m',  # Yellow
    'T': '\033[95m',  # Magenta
    'S': '\033[92m',  # Green
    'Z': '\033[91m',  # Red
    'J': '\033[94m',  # Blue
    'L': '\033[97m',  # White
    'RESET': '\033[0m'
}


class Tetromino:
    """Represents a single Tetris piece"""

    def __init__(self, shape_name: str = None):
        if shape_name is None:
            shape_name = random.choice(list(SHAPES.keys()))

        self.shape_name = shape_name
        self.shape = SHAPES[shape_name].copy()
        self.color = COLORS[shape_name]
        self.x = BOARD_WIDTH // 2
        self.y = 0

    def get_blocks(self) -> List[Tuple[int, int]]:
        """Get the absolute positions of all blocks in this piece"""
        return [(self.x + dx, self.y + dy) for dx, dy in self.shape]

    def rotate_clockwise(self):
        """Rotate the piece 90 degrees clockwise"""
        # Don't rotate the O piece (it's a square)
        if self.shape_name == 'O':
            return
        self.shape = [(-dy, dx) for dx, dy in self.shape]

    def rotate_counterclockwise(self):
        """Rotate the piece 90 degrees counterclockwise"""
        if self.shape_name == 'O':
            return
        self.shape = [(dy, -dx) for dx, dy in self.shape]


class TetrisGame:
    """Main Tetris game logic"""

    def __init__(self):
        # Initialize game board (0 = empty, shape_name = filled)
        self.board = [[EMPTY for _ in range(BOARD_WIDTH)] for _ in range(BOARD_HEIGHT)]
        self.current_piece = Tetromino()
        self.next_piece = Tetromino()
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
        self.game_over = False
        self.paused = False

    def is_valid_position(self, piece: Tetromino) -> bool:
        """Check if a piece position is valid (within bounds and not colliding)"""
        for x, y in piece.get_blocks():
            # Check boundaries
            if x < 0 or x >= BOARD_WIDTH or y >= BOARD_HEIGHT:
                return False
            # Check collision with existing blocks (ignore if y < 0, piece is spawning)
            if y >= 0 and self.board[y][x] != EMPTY:
                return False
        return True

    def lock_piece(self):
        """Lock the current piece into the board"""
        for x, y in self.current_piece.get_blocks():
            if y >= 0:  # Only lock blocks that are on the board
                self.board[y][x] = self.current_piece.shape_name

        # Check for completed lines
        self.clear_lines()

        # Spawn new piece
        self.current_piece = self.next_piece
        self.next_piece = Tetromino()

        # Check if game over (new piece can't spawn)
        if not self.is_valid_position(self.current_piece):
            self.game_over = True

    def clear_lines(self):
        """Clear completed lines and update score"""
        lines_to_clear = []

        # Find completed lines
        for y in range(BOARD_HEIGHT):
            if all(cell != EMPTY for cell in self.board[y]):
                lines_to_clear.append(y)

        # Remove completed lines
        for y in lines_to_clear:
            del self.board[y]
            self.board.insert(0, [EMPTY for _ in range(BOARD_WIDTH)])

        # Update score
        if lines_to_clear:
            self.lines_cleared += len(lines_to_clear)
            # Scoring: 100, 300, 500, 800 for 1, 2, 3, 4 lines
            points = [0, 100, 300, 500, 800]
            self.score += points[len(lines_to_clear)] * self.level

            # Level up every 10 lines
            self.level = self.lines_cleared // 10 + 1

    def move_left(self) -> bool:
        """Try to move piece left"""
        self.current_piece.x -= 1
        if not self.is_valid_position(self.current_piece):
            self.current_piece.x += 1
            return False
        return True

    def move_right(self) -> bool:
        """Try to move piece right"""
        self.current_piece.x += 1
        if not self.is_valid_position(self.current_piece):
            self.current_piece.x -= 1
            return False
        return True

    def move_down(self) -> bool:
        """Try to move piece down"""
        self.current_piece.y += 1
        if not self.is_valid_position(self.current_piece):
            self.current_piece.y -= 1
            self.lock_piece()
            return False
        return True

    def hard_drop(self):
        """Drop piece all the way down instantly"""
        drop_distance = 0
        while self.move_down():
            drop_distance += 1
        # Bonus points for hard drop
        self.score += drop_distance * 2

    def rotate(self):
        """Try to rotate piece clockwise"""
        self.current_piece.rotate_clockwise()
        if not self.is_valid_position(self.current_piece):
            # Try wall kicks (simple version)
            for dx in [1, -1, 2, -2]:
                self.current_piece.x += dx
                if self.is_valid_position(self.current_piece):
                    return
                self.current_piece.x -= dx
            # Rotation failed, rotate back
            self.current_piece.rotate_counterclockwise()

    def get_display_board(self) -> List[List[str]]:
        """Get the board with current piece for display"""
        # Create a copy of the board
        display = [[self.board[y][x] for x in range(BOARD_WIDTH)] for y in range(BOARD_HEIGHT)]

        # Add current piece
        for x, y in self.current_piece.get_blocks():
            if 0 <= y < BOARD_HEIGHT and 0 <= x < BOARD_WIDTH:
                display[y][x] = self.current_piece.shape_name

        return display


class TetrisUI:
    """Handles the terminal-based UI"""

    @staticmethod
    def clear_screen():
        """Clear the terminal screen"""
        os.system('clear' if os.name != 'nt' else 'cls')

    @staticmethod
    def render(game: TetrisGame):
        """Render the game to the terminal"""
        TetrisUI.clear_screen()

        display = game.get_display_board()

        print("\n╔" + "═" * (BOARD_WIDTH * 2) + "╗")

        for row in display:
            print("║", end="")
            for cell in row:
                if cell == EMPTY:
                    print("  ", end="")
                else:
                    color = COLORS.get(cell, COLORS['RESET'])
                    print(f"{color}██{COLORS['RESET']}", end="")
            print("║")

        print("╚" + "═" * (BOARD_WIDTH * 2) + "╝")

        # Display game info
        print(f"\nScore: {game.score}")
        print(f"Lines: {game.lines_cleared}")
        print(f"Level: {game.level}")

        # Display next piece
        print("\nNext piece:")
        next_display = [[' ' for _ in range(4)] for _ in range(4)]
        for dx, dy in game.next_piece.shape:
            nx, ny = dx + 1, dy + 1
            if 0 <= nx < 4 and 0 <= ny < 4:
                next_display[ny][nx] = '█'

        color = game.next_piece.color
        for row in next_display:
            print(f"{color}{''.join(row)}{COLORS['RESET']}")

        # Controls
        print("\nControls:")
        print("  A/D - Move left/right")
        print("  W - Rotate")
        print("  S - Soft drop")
        print("  SPACE - Hard drop")
        print("  P - Pause/Resume")
        print("  Q - Quit")

        # Show paused message
        if game.paused:
            print("\n" + "=" * 22)
            print("    ⏸  PAUSED  ⏸")
            print("  Press P to resume")
            print("=" * 22)


def get_key():
    """Get a single keypress (Unix/Linux)"""
    import termios
    import tty

    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(sys.stdin.fileno())
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch


def main():
    """Main game loop"""
    game = TetrisGame()
    ui = TetrisUI()

    # Game timing
    fall_time = 0
    fall_speed = 0.5  # Seconds between automatic drops
    last_fall = time.time()

    print("Welcome to Fun Tetris!")
    print("Press any key to start...")
    get_key()

    # Set up non-blocking input
    import termios
    import tty

    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)

    try:
        tty.setcbreak(sys.stdin.fileno())

        while not game.game_over:
            ui.render(game)

            # Auto-drop based on level (only if not paused)
            if not game.paused:
                current_time = time.time()
                if current_time - last_fall > fall_speed / game.level:
                    game.move_down()
                    last_fall = current_time

            # Non-blocking input check
            import select
            if select.select([sys.stdin], [], [], 0.05)[0]:
                key = sys.stdin.read(1).lower()

                if key == 'q':
                    break
                elif key == 'p':
                    game.paused = not game.paused
                elif not game.paused:  # Only process game moves when not paused
                    if key == 'a':
                        game.move_left()
                    elif key == 'd':
                        game.move_right()
                    elif key == 's':
                        game.move_down()
                    elif key == 'w':
                        game.rotate()
                    elif key == ' ':
                        game.hard_drop()

        # Game over screen
        ui.render(game)
        print("\n╔════════════════════╗")
        print("║   GAME OVER!       ║")
        print("╔════════════════════╗")
        print(f"Final Score: {game.score}")
        print(f"Lines Cleared: {game.lines_cleared}")
        print(f"Level Reached: {game.level}")

    finally:
        # Restore terminal settings
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        print("\nThanks for playing!")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nGame interrupted. Thanks for playing!")
        sys.exit(0)
