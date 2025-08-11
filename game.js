const boardElement = document.getElementById("chessboard");
const statusElement = document.getElementById("status");

const PIECES = {
  black: {
    rook: "♜",
    knight: "♞",
    bishop: "♝",
    queen: "♛",
    king: "♚",
    pawn: "♟"
  },
  white: {
    rook: "♖",
    knight: "♘",
    bishop: "♗",
    queen: "♕",
    king: "♔",
    pawn: "♙"
  }
};

let gameState = {
  board: [],
  selected: null,
  currentTurn: "white", // white = player, black = computer
  possibleMoves: [],    // store legal moves from selected piece
  isProcessingMove: false, // to disable clicks during AI move
};

let gameOver = false;  // game over flag

// Initialize the board layout
function initBoard() {
  gameState.board = [
    [PIECES.black.rook, PIECES.black.knight, PIECES.black.bishop, PIECES.black.queen, PIECES.black.king, PIECES.black.bishop, PIECES.black.knight, PIECES.black.rook],
    Array(8).fill(PIECES.black.pawn),
    Array(8).fill(""),
    Array(8).fill(""),
    Array(8).fill(""),
    Array(8).fill(""),
    Array(8).fill(PIECES.white.pawn),
    [PIECES.white.rook, PIECES.white.knight, PIECES.white.bishop, PIECES.white.queen, PIECES.white.king, PIECES.white.bishop, PIECES.white.knight, PIECES.white.rook]
  ];
  gameState.selected = null;
  gameState.possibleMoves = [];
  gameState.currentTurn = "white";
  gameState.isProcessingMove = false;
  gameOver = false;
  updateStatus();
}

// Get color of piece or null if empty
function getPieceColor(piece) {
  if (!piece) return null;
  if (Object.values(PIECES.white).includes(piece)) return "white";
  if (Object.values(PIECES.black).includes(piece)) return "black";
  return null;
}

// Render the board UI
function renderBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;
      square.textContent = gameState.board[row][col];
      square.addEventListener("click", onSquareClick);

      // Highlight selected piece
      if (
        gameState.selected &&
        gameState.selected.row === row &&
        gameState.selected.col === col
      ) {
        square.classList.add("selected");
      }

      // Highlight possible moves squares
      if (gameState.possibleMoves.some(m => m.toRow === row && m.toCol === col)) {
        square.classList.add("possible-move");
      }

      boardElement.appendChild(square);
    }
  }
}

// Highlight a square briefly where piece moved
function highlightMove(row, col) {
  const squares = document.querySelectorAll('.square');
  squares.forEach(sq => {
    if (+sq.dataset.row === row && +sq.dataset.col === col) {
      sq.classList.add('move-highlight');
      setTimeout(() => {
        sq.classList.remove('move-highlight');
      }, 500);
    }
  });
}

// Update status text showing whose turn it is
function updateStatus() {
  if (gameOver) {
    statusElement.textContent = "Game Over";
    return;
  }
  if (gameState.currentTurn === "white") {
    statusElement.textContent = "Your turn (White)";
  } else {
    statusElement.textContent = "Computer's turn (Black) - thinking...";
  }
}

// Check if king of given color is still on the board
function isKingPresent(color) {
  const king = color === "white" ? PIECES.white.king : PIECES.black.king;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (gameState.board[row][col] === king) return true;
    }
  }
  return false;
}

// Check if the given color has any legal moves left
function hasAnyLegalMoves(color) {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = gameState.board[fromRow][fromCol];
      if (getPieceColor(piece) !== color) continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (isLegalMove(piece, fromRow, fromCol, toRow, toCol)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Check if game ended and declare result
function checkGameOver() {
  if (!isKingPresent("white")) {
    gameOver = true;
    alert("Computer Wins! You lost your King.");
    updateStatus();
    return true;
  }
  if (!isKingPresent("black")) {
    gameOver = true;
    alert("You Win! Computer lost its King.");
    updateStatus();
    return true;
  }
  if (!hasAnyLegalMoves(gameState.currentTurn)) {
    gameOver = true;
    alert("No legal moves! It's a stalemate or checkmate. Game Over.");
    updateStatus();
    return true;
  }
  return false;
}

// Handle player clicks
function onSquareClick(e) {
  if (gameOver) return;  // block input after game over
  if (gameState.isProcessingMove) return; // ignore clicks during AI move
  if (gameState.currentTurn !== "white") return;

  const row = +e.currentTarget.dataset.row;
  const col = +e.currentTarget.dataset.col;
  const clickedPiece = gameState.board[row][col];
  const selected = gameState.selected;

  if (selected) {
    // Check if clicked square is a legal move
    const move = gameState.possibleMoves.find(m => m.toRow === row && m.toCol === col);
    if (move) {
      // Move piece
      gameState.board[row][col] = gameState.board[selected.row][selected.col];
      gameState.board[selected.row][selected.col] = "";
      gameState.selected = null;
      gameState.possibleMoves = [];
      highlightMove(row, col);
      switchTurn();
      renderBoard();
      updateStatus();

      if (checkGameOver()) return;

      // Computer moves after a short delay
      gameState.isProcessingMove = true;
      setTimeout(() => {
        computerMove();
        gameState.isProcessingMove = false;
        updateStatus();
        checkGameOver();
      }, 500);

    } else {
      // Clicked outside legal moves -> clear selection
      gameState.selected = null;
      gameState.possibleMoves = [];
      renderBoard();
    }
  } else {
    // Select piece only if it's player's color
    if (getPieceColor(clickedPiece) === "white") {
      gameState.selected = { row, col };
      gameState.possibleMoves = calculateLegalMoves(clickedPiece, row, col);
      renderBoard();
    }
  }
}

// Calculate legal moves for selected piece (for white and black)
function calculateLegalMoves(piece, fromRow, fromCol) {
  const moves = [];

  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isLegalMove(piece, fromRow, fromCol, toRow, toCol)) {
        moves.push({ toRow, toCol });
      }
    }
  }

  return moves;
}

// Basic move validation for pawns and knights only
function isLegalMove(piece, fromRow, fromCol, toRow, toCol) {
  const targetPiece = gameState.board[toRow][toCol];
  const color = getPieceColor(piece);
  const direction = color === "white" ? -1 : 1;

  // Can't capture own pieces
  if (getPieceColor(targetPiece) === color) return false;

  // Pawn moves
  if (piece === PIECES.white.pawn || piece === PIECES.black.pawn) {
    // Move forward one
    if (
      fromCol === toCol &&
      gameState.board[toRow][toCol] === "" &&
      toRow === fromRow + direction
    ) return true;

    // Diagonal capture
    if (
      Math.abs(toCol - fromCol) === 1 &&
      toRow === fromRow + direction &&
      targetPiece !== "" &&
      getPieceColor(targetPiece) !== color
    ) return true;

    return false;
  }

  // Knight moves
  if (piece === PIECES.white.knight || piece === PIECES.black.knight) {
    const dx = Math.abs(toCol - fromCol);
    const dy = Math.abs(toRow - fromRow);
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
  }

  // For other pieces, allow any move for now (you can improve this later)
  return true;
}

// Switch turn between player and computer
function switchTurn() {
  gameState.currentTurn = gameState.currentTurn === "white" ? "black" : "white";
  updateStatus();
}

// Computer makes a random legal move
function computerMove() {
  if (gameOver) return;  // no moves after game over

  const moves = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = gameState.board[fromRow][fromCol];
      if (getPieceColor(piece) !== "black") continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (isLegalMove(piece, fromRow, fromCol, toRow, toCol)) {
            moves.push({ fromRow, fromCol, toRow, toCol });
          }
        }
      }
    }
  }

  if (moves.length === 0) {
    alert("Computer has no legal moves! Game over.");
    gameOver = true;
    updateStatus();
    return;
  }

  const move = moves[Math.floor(Math.random() * moves.length)];
  const piece = gameState.board[move.fromRow][move.fromCol];

  gameState.board[move.toRow][move.toCol] = piece;
  gameState.board[move.fromRow][move.fromCol] = "";

  highlightMove(move.toRow, move.toCol);
  switchTurn();
  renderBoard();
  updateStatus();
}

// Start game
initBoard();
renderBoard();
