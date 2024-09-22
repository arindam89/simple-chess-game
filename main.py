from flask import Flask, render_template, request, jsonify
from chess_game import ChessGame

app = Flask(__name__)
game = ChessGame()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/move', methods=['POST'])
def make_move():
    move = request.json['move']
    if move == 'initial':
        return jsonify(game._get_game_state())
    result = game.make_move(move)
    return jsonify(result)

@app.route('/ai_move')
def ai_move():
    result = game.ai_move()
    return jsonify(result)

@app.route('/reset', methods=['POST'])
def reset_game():
    difficulty = request.json.get('difficulty', 'medium')
    time_limit = request.json.get('time_limit', 600)
    game.reset(ai_difficulty=difficulty, time_limit=time_limit)
    return jsonify({"status": "ok"})

@app.route('/set_difficulty', methods=['POST'])
def set_difficulty():
    difficulty = request.json['difficulty']
    time_limit = request.json.get('time_limit', 600)
    game.reset(ai_difficulty=difficulty, time_limit=time_limit)
    return jsonify({"status": "ok"})

@app.route('/get_time', methods=['GET'])
def get_time():
    return jsonify(game.get_current_times())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
