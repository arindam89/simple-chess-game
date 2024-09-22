import chess
import random

class MinimaxAI:
    def __init__(self, depth):
        self.depth = depth

    @classmethod
    def create_ai(cls, difficulty):
        if difficulty == "easy":
            return cls(depth=1)
        elif difficulty == "medium":
            return cls(depth=3)
        elif difficulty == "hard":
            return cls(depth=5)
        else:
            raise ValueError("Invalid difficulty level")

    def get_best_move(self, board):
        best_move = None
        best_score = float('-inf')
        alpha = float('-inf')
        beta = float('inf')

        for move in board.legal_moves:
            board.push(move)
            score = -self._minimax(board, self.depth - 1, -beta, -alpha, False)
            board.pop()

            if score > best_score:
                best_score = score
                best_move = move

            alpha = max(alpha, score)
            if alpha >= beta:
                break

        return best_move if best_move else random.choice(list(board.legal_moves))

    def _minimax(self, board, depth, alpha, beta, maximizing_player):
        if depth == 0 or board.is_game_over():
            return self._evaluate_board(board)

        if maximizing_player:
            max_eval = float('-inf')
            for move in board.legal_moves:
                board.push(move)
                eval = self._minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in board.legal_moves:
                board.push(move)
                eval = self._minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:
                    break
            return min_eval

    def _evaluate_board(self, board):
        if board.is_checkmate():
            return -10000 if board.turn else 10000
        if board.is_stalemate() or board.is_insufficient_material():
            return 0

        piece_values = {
            chess.PAWN: 100,
            chess.KNIGHT: 320,
            chess.BISHOP: 330,
            chess.ROOK: 500,
            chess.QUEEN: 900,
            chess.KING: 20000
        }

        score = 0
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece:
                value = piece_values[piece.piece_type]
                score += value if piece.color == chess.WHITE else -value

        return score
