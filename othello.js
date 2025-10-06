// --- ゲームの状態管理 ---
const BOARD_SIZE = 8;
// 0: 空き, 1: 黒 (Black), 2: 白 (White)
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
let board = [];
let currentPlayer = BLACK;

// 8方向の定義 (dr, dc)
const DIRECTIONS = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
    [-1, -1], [-1, 1], [1, -1], [1, 1] // 斜め
];

// HTML要素
const boardElement = document.getElementById('othello-board');
const currentPlayerElement = document.getElementById('current-player');
const scoreBlackElement = document.getElementById('score-black');
const scoreWhiteElement = document.getElementById('score-white');

/**
 * 新しいゲームボードを初期化
 */
function initBoard() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // 初期配置 (中央の4マス)
    const center = BOARD_SIZE / 2;
    board[center - 1][center - 1] = WHITE;
    board[center - 1][center]     = BLACK;
    board[center][center - 1]     = BLACK;
    board[center][center]         = WHITE;
    
    currentPlayer = BLACK;
}

/**
 * 盤面をHTMLに描画
 */
function renderBoard() {
    boardElement.innerHTML = ''; // ボードをクリア
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);
            
            if (board[r][c] !== EMPTY) {
                const disc = document.createElement('div');
                disc.className = `disc ${board[r][c] === BLACK ? 'black' : 'white'}`;
                cell.appendChild(disc);
            }
            
            boardElement.appendChild(cell);
        }
    }
    updateScoreDisplay();
}

/**
 * クリックイベントハンドラ
 */
function handleCellClick(event) {
    const r = parseInt(event.target.dataset.row);
    const c = parseInt(event.target.dataset.col);
    
    if (board[r][c] !== EMPTY) {
        return; // すでに石がある場合は何もしない
    }
    
    const opponent = currentPlayer === BLACK ? WHITE : BLACK;
    const flippedDiscs = getFlippableDiscs(r, c, currentPlayer, opponent);
    
    if (flippedDiscs.length > 0) {
        // 合法手の場合、石を置く
        board[r][c] = currentPlayer;
        
        // 石を反転させる
        flippedDiscs.forEach(([fr, fc]) => {
            board[fr][fc] = currentPlayer;
        });
        
        // ターンを交代
        switchTurn();
        renderBoard();
        
        // パスやゲーム終了の判定
        checkGameStatus();
    }
}

/**
 * 指定されたセルに石を置いた場合に反転できる石のリストを取得
 * @param {number} r 行
 * @param {number} c 列
 * @param {number} player 現在のプレイヤー
 * @param {number} opponent 相手プレイヤー
 * @returns {Array<[number, number]>} 反転できる石の座標リスト
 */
function getFlippableDiscs(r, c, player, opponent) {
    let flippable = [];
    
    // 8方向すべてをチェック
    for (const [dr, dc] of DIRECTIONS) {
        let currentLine = [];
        let nextR = r + dr;
        let nextC = c + dc;
        
        while (nextR >= 0 && nextR < BOARD_SIZE && nextC >= 0 && nextC < BOARD_SIZE) {
            const cell = board[nextR][nextC];
            
            if (cell === opponent) {
                // 相手の石ならリストに追加してさらに探索
                currentLine.push([nextR, nextC]);
            } else if (cell === player) {
                // 自分の石なら挟めているので、currentLineをflippableに追加してループを抜ける
                flippable = flippable.concat(currentLine);
                break;
            } else if (cell === EMPTY) {
                // 空きマスなら挟めていないのでループを抜ける
                break;
            }
            
            nextR += dr;
            nextC += dc;
        }
    }
    
    return flippable;
}

/**
 * ターンを交代
 */
function switchTurn() {
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    currentPlayerElement.textContent = currentPlayer === BLACK ? '黒' : '白';
}

/**
 * 合法手が存在するかどうかをチェック
 * @param {number} player プレイヤー
 * @param {number} opponent 相手プレイヤー
 * @returns {boolean} 合法手が存在すれば true
 */
function hasValidMove(player, opponent) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) {
                if (getFlippableDiscs(r, c, player, opponent).length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * ゲームの状態をチェック（パス、ゲーム終了）
 */
function checkGameStatus() {
    const opponent = currentPlayer === BLACK ? WHITE : BLACK;

    // 1. 現在のプレイヤーに合法手があるか
    if (hasValidMove(currentPlayer, opponent)) {
        return; // プレイ続行
    }

    // 2. 現在のプレイヤーは合法手がない（パスの可能性）
    
    // 相手に合法手があるか
    if (hasValidMove(opponent, currentPlayer)) {
        // 両プレイヤーのターンを1回ずつ交代し、パスとして処理
        alert(`${currentPlayer === BLACK ? '黒' : '白'}は打てるマスがないためパスします。`);
        switchTurn(); // 相手のターンにする
    } else {
        // どちらのプレイヤーにも合法手がない (ゲーム終了)
        endGame();
    }
}

/**
 * スコア表示を更新
 */
function updateScoreDisplay() {
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) {
                blackCount++;
            } else if (board[r][c] === WHITE) {
                whiteCount++;
            }
        }
    }

    scoreBlackElement.textContent = blackCount;
    scoreWhiteElement.textContent = whiteCount;
}

/**
 * ゲーム終了処理
 */
function endGame() {
    // 最終スコアを計算
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) {
                blackCount++;
            } else if (board[r][c] === WHITE) {
                whiteCount++;
            }
        }
    }

    let winnerMessage;
    if (blackCount > whiteCount) {
        winnerMessage = `黒の勝利！ スコア: 黒 ${blackCount} - 白 ${whiteCount}`;
    } else if (whiteCount > blackCount) {
        winnerMessage = `白の勝利！ スコア: 黒 ${blackCount} - 白 ${whiteCount}`;
    } else {
        winnerMessage = `引き分け！ スコア: 黒 ${blackCount} - 白 ${whiteCount}`;
    }

    alert(`ゲーム終了！\n${winnerMessage}`);

    // (必要に応じて、リスタートボタンなどを追加)
}


// --- ゲーム開始 ---
initBoard();
renderBoard();