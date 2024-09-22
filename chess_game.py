import chess
from ai_player import MinimaxAI
import time

class ChessGame:
    def __init__(self, ai_difficulty="medium", time_limit=600):  # 10 minutes by default
        self.board = chess.Board()
        self.ai = MinimaxAI.create_ai(ai_difficulty)
        self.time_limit = time_limit
        self.white_time = time_limit
        self.black_time = time_limit
        self.last_move_time = None
        self.game_start_time = None

    def make_move(self, move):
        try:
            chess_move = chess.Move.from_uci(move)
            if chess_move in self.board.legal_moves:
                self._update_time()
                self.board.push(chess_move)
                self.last_move_time = time.time()
                return self._get_game_state()
            else:
                return {"error": "Illegal move"}
        except ValueError:
            return {"error": "Invalid move format"}

    def ai_move(self):
        if not self.board.is_game_over():
            self._update_time()
            ai_move = self.ai.get_best_move(self.board)
            self.board.push(ai_move)
            self.last_move_time = time.time()
            return self._get_game_state()
        return {"error": "Game is over"}

    def reset(self, ai_difficulty="medium", time_limit=600):
        self.board.reset()
        self.ai = MinimaxAI.create_ai(ai_difficulty)
        self.time_limit = time_limit
        self.white_time = time_limit
        self.black_time = time_limit
        self.last_move_time = None
        self.game_start_time = time.time()

    def _update_time(self):
        current_time = time.time()
        if self.last_move_time is not None:
            elapsed_time = current_time - self.last_move_time
            if self.board.turn == chess.WHITE:
                self.black_time -= elapsed_time
            else:
                self.white_time -= elapsed_time

        if self.white_time <= 0 or self.black_time <= 0:
            self.board.set_result("0-1" if self.white_time <= 0 else "1-0")

        self.last_move_time = current_time

    def get_current_times(self):
        self._update_time()
        return {
            "white_time": max(0, round(self.white_time)),
            "black_time": max(0, round(self.black_time))
        }

    def _get_game_state(self):
        return {
            "fen": self.board.fen(),
            "turn": "white" if self.board.turn == chess.WHITE else "black",
            "in_check": self.board.is_check(),
            "game_over": self.board.is_game_over(),
            "checkmate": self.board.is_checkmate(),
            "stalemate": self.board.is_stalemate(),
            **self.get_current_times()
        }
