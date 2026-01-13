from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder="static")
socketio = SocketIO(app, cors_allowed_origins="*")

# ===== CONSTANTS =====
START_X, START_Y = 60, 225
WIRE_Y = 225
WIRE_TOLERANCE = 6
SPEED = 3.0

# ===== STATE =====
cursor_x = START_X
cursor_y = START_Y
started = False
game_over = False

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

def state():
    return {
        "x": cursor_x,
        "y": cursor_y,
        "started": started,
        "gameOver": game_over
    }

@socketio.on("start")
def start_game():
    global started, game_over, cursor_x, cursor_y
    started = True
    game_over = False
    cursor_x, cursor_y = START_X, START_Y
    emit("state", state())

@socketio.on("move")
def move(data):
    global cursor_x, cursor_y, game_over

    if not started or game_over:
        return

    cursor_x += data["dx"] * SPEED
    cursor_y += data["dy"] * SPEED

    # ❌ STRICT RULE
    if abs(cursor_y - WIRE_Y) > WIRE_TOLERANCE:
        game_over = True

    emit("state", state())

@socketio.on("release")
def release():
    global game_over
    if started:
        game_over = True
        emit("state", state())

@socketio.on("restart")
def restart():
    global started, game_over, cursor_x, cursor_y
    started = False
    game_over = False
    cursor_x, cursor_y = START_X, START_Y
    emit("state", state())

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)

