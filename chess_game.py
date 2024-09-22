import chess
from ai_player import MinimaxAI

class ChessGame:
    def __init__(self, ai_difficulty="medium"):
        self.board = chess.Board()
        self.ai = MinimaxAI.create_ai(ai_difficulty)

    def make_move(self, move):
        try:
            chess_move = chess.Move.from_uci(move)
            if chess_move in self.board.legal_moves:
                self.board.push(chess_move)
                return self._get_game_state()
            else:
                return {"error": "Illegal move"}
        except ValueError:
            return {"error": "Invalid move format"}

    def ai_move(self):
        if not self.board.is_game_over():
            ai_move = self.ai.get_best_move(self.board)
            self.board.push(ai_move)
            return self._get_game_state()
        return {"error": "Game is over"}

    def reset(self, ai_difficulty="medium"):
        self.board.reset()
        self.ai = MinimaxAI.create_ai(ai_difficulty)

    def _get_game_state(self):
        return {
            "fen": self.board.fen(),
            "turn": "white" if self.board.turn == chess.WHITE else "black",
            "in_check": self.board.is_check(),
            "game_over": self.board.is_game_over(),
            "checkmate": self.board.is_checkmate(),
            "stalemate": self.board.is_stalemate(),
        }
