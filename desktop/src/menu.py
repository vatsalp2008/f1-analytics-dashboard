import arcade
from src.f1_data import get_season_events
from typing import Callable
import datetime


class RaceSelectionMenu(arcade.Window):
    """
    GUI Menu for selecting F1 races to replay.
    Allows users to browse races by year and select sessions to visualize.
    """
    
    def __init__(self, on_race_selected: Callable):
        """
        Initialize the race selection menu.
        
        Args:
            on_race_selected: Callback function(year, round, session_type) when user launches a race
        """
        super().__init__(1100, 750, "F1 Race Replay - Select Race", resizable=False)
        arcade.set_background_color((20, 25, 35))
        
        self.on_race_selected = on_race_selected
        
        # State
        self.current_year = datetime.datetime.now().year
        self.selected_round = None
        self.selected_event = None
        self.session_type = 'R'  # Default to Race
        self.events = []
        self.loading = False
        self.error_message = None
        
        # Scroll offset for race list
        self.scroll_offset = 0
        self.max_visible_races = 8
        
        # UI regions
        self.year_buttons = []
        self.race_buttons = []
        self.session_buttons = []
        self.launch_button_rect = None
        
        self.setup_ui_regions()
        self.load_events(self.current_year)
    
    def setup_ui_regions(self):
        """Set up the clickable regions for UI elements"""
        # Year buttons (2018-2025) - Better spacing
        x_start = 120
        y = 655  # Moved down to avoid overlap
        current_year = datetime.datetime.now().year
        
        self.year_buttons = []
        for i, year in enumerate(range(2018, current_year + 1)):
            x = x_start + (i * 110)
            self.year_buttons.append({
                'year': year,
                'rect': (x, y, 100, 45),
                'selected': year == self.current_year
            })
        
        # Session type buttons - Better positioned
        session_x = 150
        session_y = 110  # Moved down to avoid overlap
        self.session_buttons = [
            {'type': 'R', 'label': 'Race', 'rect': (session_x, session_y, 140, 50)},
            {'type': 'Q', 'label': 'Qualifying', 'rect': (session_x + 160, session_y, 140, 50)},
            {'type': 'S', 'label': 'Sprint', 'rect': (session_x + 320, session_y, 140, 50)},
        ]
        
        # Launch button - Bigger and more prominent
        self.launch_button_rect = (700, 110, 280, 50)  # Aligned with session buttons
    
    def load_events(self, year):
        """Load events for the selected year"""
        self.loading = True
        self.error_message = None
        
        try:
            self.events = get_season_events(year)
            self.scroll_offset = 0
            self.create_race_buttons()
        except Exception as e:
            self.error_message = f"Error loading events: {str(e)}"
            self.events = []
        finally:
            self.loading = False
    
    def create_race_buttons(self):
        """Create clickable regions for each race"""
        self.race_buttons = []
        y_start = 580
        
        for i, event in enumerate(self.events):
            y = y_start - (i * 50) + self.scroll_offset
            self.race_buttons.append({
                'event': event,
                'rect': (50, y, 1000, 45),
                'visible': 210 < y < 620
            })
    
    def point_in_rect(self, point, rect):
        """Check if a point is inside a rectangle"""
        x, y = point
        rx, ry, rw, rh = rect
        return rx <= x <= rx + rw and ry <= y <= ry + rh
    
    def on_mouse_press(self, x, y, button, modifiers):
        """Handle mouse clicks"""
        # Year buttons
        for year_btn in self.year_buttons:
            if self.point_in_rect((x, y), year_btn['rect']):
                self.current_year = year_btn['year']
                for btn in self.year_buttons:
                    btn['selected'] = btn['year'] == self.current_year
                self.load_events(self.current_year)
                return
        
        # Race buttons
        for race_btn in self.race_buttons:
            if race_btn['visible'] and self.point_in_rect((x, y), race_btn['rect']):
                self.selected_event = race_btn['event']
                self.selected_round = race_btn['event']['round']
                return
        
        # Session type buttons
        for session_btn in self.session_buttons:
            if self.point_in_rect((x, y), session_btn['rect']):
                self.session_type = session_btn['type']
                return
        
        # Launch button
        if self.launch_button_rect and self.point_in_rect((x, y), self.launch_button_rect):
            self.launch_replay()
    
    def on_mouse_scroll(self, x, y, scroll_x, scroll_y):
        """Handle mouse scrolling for race list"""
        self.scroll_offset += scroll_y * 25
        # Clamp scroll offset
        max_scroll = max(0, (len(self.events) - self.max_visible_races) * 50)
        self.scroll_offset = max(-max_scroll, min(0, self.scroll_offset))
        self.create_race_buttons()
    
    def launch_replay(self):
        """Launch the selected race replay"""
        if self.selected_round is None:
            return
        
        # Close this window and call the callback
        self.on_race_selected(self.current_year, self.selected_round, self.session_type)
        self.close()
    
    def on_draw(self):
        """Render the screen"""
        self.clear()
        
        # === TITLE SECTION ===
        arcade.draw_text(
            "F1 RACE REPLAY",
            self.width // 2, 715,
            arcade.color.WHITE,
            font_size=28,
            anchor_x="center",
            bold=True
        )
        
        # Title underline
        arcade.draw_line(
            100, 695, self.width - 100, 695,
            arcade.color.RED, 3
        )
        
        # === YEAR SELECTOR SECTION ===
        arcade.draw_text(
            "Select Season:",
            60, 640,
            arcade.color.LIGHT_GRAY,
            font_size=16,
            bold=True
        )
        
        # Year buttons
        for year_btn in self.year_buttons:
            rx, ry, rw, rh = year_btn['rect']
            if year_btn['selected']:
                color = (200, 30, 30)  # F1 Red
                border_color = arcade.color.WHITE
                border_width = 3
            else:
                color = (60, 65, 75)
                border_color = (100, 100, 100)
                border_width = 2
            
            rect = arcade.XYWH(rx + rw/2, ry + rh/2, rw, rh)
            arcade.draw_rect_filled(rect, color)
            arcade.draw_rect_outline(rect, border_color, border_width)
            arcade.draw_text(
                str(year_btn['year']),
                rx + rw/2, ry + rh/2 - 6,
                arcade.color.WHITE,
                font_size=16,
                anchor_x="center",
                bold=year_btn['selected']
            )
        
        # === RACE LIST SECTION ===
        # Section header
        arcade.draw_text(
            f"Grand Prix Calendar - {self.current_year}",
            60, 595,
            arcade.color.LIGHT_GRAY,
            font_size=16,
            bold=True
        )
        
        # Race list container background
        list_bg = arcade.XYWH(self.width / 2, 380, 1000, 410)
        arcade.draw_rect_filled(list_bg, (30, 35, 45))
        arcade.draw_rect_outline(list_bg, (80, 80, 80), 2)
        
        if self.loading:
            arcade.draw_text(
                "Loading races...",
                self.width // 2, 410,
                arcade.color.WHITE,
                font_size=18,
                anchor_x="center"
            )
        elif self.error_message:
            arcade.draw_text(
                self.error_message,
                self.width // 2, 410,
                arcade.color.RED,
                font_size=14,
                anchor_x="center"
            )
        else:
            # Draw race buttons
            for race_btn in self.race_buttons:
                if not race_btn['visible']:
                    continue
                
                event = race_btn['event']
                rx, ry, rw, rh = race_btn['rect']
                
                # Highlight if selected
                is_selected = self.selected_event and self.selected_event['round'] == event['round']
                
                if is_selected:
                    color = (200, 30, 30, 200)  # F1 Red
                    text_color = arcade.color.WHITE
                    border_color = arcade.color.WHITE
                else:
                    color = (50, 55, 65)
                    text_color = (200, 200, 200)
                    border_color = (70, 70, 70)
                
                rect = arcade.XYWH(rx + rw/2, ry + rh/2, rw, rh)
                arcade.draw_rect_filled(rect, color)
                arcade.draw_rect_outline(rect, border_color, 1)
                
                # Race text
                sprint_indicator = " 🏁" if event['has_sprint'] else ""
                text = f"Round {event['round']:2d}:  {event['name']}{sprint_indicator}"
                
                arcade.draw_text(
                    text,
                    rx + 15, ry + rh/2 - 5,
                    text_color,
                    font_size=13,
                    bold=is_selected
                )
            
            # Scroll indicator
            if len(self.events) > self.max_visible_races:
                arcade.draw_text(
                    "↕ Scroll for more races",
                    self.width // 2, 185,
                    (150, 150, 150),
                    font_size=11,
                    anchor_x="center",
                    italic=True
                )
        
        # === SESSION TYPE & LAUNCH SECTION ===
        # Section divider
        arcade.draw_line(
            50, 175, self.width - 50, 175,
            (80, 80, 80), 2
        )
        
        arcade.draw_text(
            "Session Type:",
            60, 135,
            arcade.color.LIGHT_GRAY,
            font_size=16,
            bold=True
        )
        
        for session_btn in self.session_buttons:
            rx, ry, rw, rh = session_btn['rect']
            is_selected = self.session_type == session_btn['type']
            
            if is_selected:
                color = (200, 30, 30)
                border_color = arcade.color.WHITE
                border_width = 3
            else:
                color = (60, 65, 75)
                border_color = (100, 100, 100)
                border_width = 2
            
            rect = arcade.XYWH(rx + rw/2, ry + rh/2, rw, rh)
            arcade.draw_rect_filled(rect, color)
            arcade.draw_rect_outline(rect, border_color, border_width)
            arcade.draw_text(
                session_btn['label'],
                rx + rw/2, ry + rh/2 - 6,
                arcade.color.WHITE,
                font_size=14,
                anchor_x="center",
                bold=is_selected
            )
        
        # Launch button
        if self.launch_button_rect:
            rx, ry, rw, rh = self.launch_button_rect
            
            if self.selected_round:
                color = (40, 180, 40)  # Green
                border_color = arcade.color.WHITE
                border_width = 3
                text_color = arcade.color.WHITE
            else:
                color = (50, 50, 50)
                border_color = (80, 80, 80)
                border_width = 2
                text_color = (120, 120, 120)
            
            rect = arcade.XYWH(rx + rw/2, ry + rh/2, rw, rh)
            arcade.draw_rect_filled(rect, color)
            arcade.draw_rect_outline(rect, border_color, border_width)
            arcade.draw_text(
                "▶  LAUNCH REPLAY",
                rx + rw/2, ry + rh/2 - 7,
                text_color,
                font_size=18,
                anchor_x="center",
                bold=True
            )
        
        # === STATUS BAR ===
        status_bg = arcade.XYWH(self.width / 2, 50, self.width - 100, 70)
        arcade.draw_rect_filled(status_bg, (40, 45, 55))
        arcade.draw_rect_outline(status_bg, (80, 80, 80), 1)
        
        if self.selected_event:
            status = f"Selected: {self.selected_event['name']}  •  "
            status += {'R': 'Race', 'Q': 'Qualifying', 'S': 'Sprint'}.get(self.session_type, self.session_type)
            status += f"  •  Round {self.selected_round}"
            color = (100, 255, 100)
        else:
            status = "← Select a Grand Prix from the list above to continue"
            color = (180, 180, 180)
        
        arcade.draw_text(
            status,
            self.width // 2, 50,
            color,
            font_size=14,
            anchor_x="center",
            bold=self.selected_event is not None
        )
        
        # Hint text
        arcade.draw_text(
            "Press ESC to exit",
            self.width - 20, 15,
            (100, 100, 100),
            font_size=10,
            anchor_x="right",
            italic=True
        )
    
    def on_key_press(self, key, modifiers):
        """Handle key presses"""
        if key == arcade.key.ESCAPE:
            self.close()
        elif key == arcade.key.ENTER and self.selected_round:
            self.launch_replay()


def show_menu(on_race_selected: Callable):
    """
    Show the race selection menu.
    
    Args:
        on_race_selected: Callback function(year, round, session_type) when user launches a race
    """
    menu = RaceSelectionMenu(on_race_selected)
    arcade.run()
