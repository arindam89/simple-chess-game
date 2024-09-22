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

@app.route('/reset')
def reset_game():
    game.reset()
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
