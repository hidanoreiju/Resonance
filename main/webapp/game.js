/**
 * 1-1：灰降る静寂の道 - 修正完全版
 */

const PLAYER = { 
    res: 0, 
    currentScene: "1-1", 
    x: 10, 
    y: 18, 
    observedCount: 0, 
    flags: { LUCAS_FOUGHT: false, LUCAS_OBSERVED: false } 
};

const MAP_SIZE = 20;
const SIGHT_RADIUS = 5; 
const MAPS = { "1-1": generateMapData() };

function generateMapData() {
    let map = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(0));
    // 道の生成（少し余裕を持たせてスタック防止）
    for (let y = 1; y < 19; y++) {
        for (let x = 7; x <= 13; x++) map[y][x] = 1; 
    }
    map[18][10] = 2; // スタート
    map[15][9] = 3;  // 片
    map[10][11] = 3; // 片
    map[5][10] = 4;  // ルーカス
    map[1][10] = 5;  // 門
    return map;
}

function initGame() {
    renderMap();
    updateUI();
}

function renderMap() {
    const visualArea = document.getElementById("visual-area");
    visualArea.innerHTML = "";
    applyResonanceEffects(visualArea);

    const tileSize = 35; 
    visualArea.style.gridTemplateColumns = `repeat(${MAP_SIZE}, ${tileSize}px)`;
    
    const map = MAPS[PLAYER.currentScene];
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            const dist = Math.abs(PLAYER.x - x) + Math.abs(PLAYER.y - y);
            
            if (dist > SIGHT_RADIUS) {
                tile.style.background = "#000"; 
            } else {
                if (x === PLAYER.x && y === PLAYER.y) { 
                    tile.innerText = "●"; tile.classList.add("player-tile"); 
                }
                else if (cell === 3) { tile.innerText = "✧"; tile.style.color = "#8af"; }
                else if (cell === 4) { tile.innerText = "⚔"; tile.style.color = "#fff"; }
                else if (cell === 5) { tile.innerText = "門"; tile.style.color = "#f00"; }
                else if (cell === 1 || cell === 2) { tile.style.background = "#1a1a1a"; }
                else { tile.style.background = "#050505"; }
            }
            visualArea.appendChild(tile);
        });
    });
}

function applyResonanceEffects(element) {
    element.classList.remove("shake-effect");
    element.style.filter = "none";
    if (PLAYER.res >= 95) { element.classList.add("shake-effect"); element.style.filter = "grayscale(100%)"; }
    else if (PLAYER.res >= 70) { element.style.filter = "saturate(30%) contrast(120%)"; }
    else if (PLAYER.res >= 31) { element.style.filter = "saturate(70%)"; }
}

function move(dx, dy) {
    // 戦闘中や選択中は何もしない
    if (document.querySelector('.battle-menu') || document.querySelector('.choice-menu')) return;

    const nextX = PLAYER.x + dx, nextY = PLAYER.y + dy;
    const map = MAPS[PLAYER.currentScene];

    // 範囲外 or 壁(0)は移動不可
    if (nextY < 0 || nextY >= MAP_SIZE || nextX < 0 || nextX >= MAP_SIZE || map[nextY][nextX] === 0) return;
    
    // 門の制限
    if (map[nextY][nextX] === 5 && !PLAYER.flags.LUCAS_FOUGHT) {
        logMessage("門の前に白銀の騎士が立ちはだかっている。");
        return;
    }

    PLAYER.x = nextX; PLAYER.y = nextY;
    handleEvent(map[nextY][nextX], nextX, nextY);
    
    // 移動のたびに必ず描画とUI更新を行う（スタック防止）
    renderMap();
    updateUI(); 
}

function handleEvent(type, x, y) {
    if (type === 4 && !PLAYER.flags.LUCAS_FOUGHT) {
        startLucasBattle();
    } else if (type === 3) {
        logMessage("「記憶の断片」を回収した。意識が遠のく……。");
        PLAYER.res += 5; 
        MAPS[PLAYER.currentScene][y][x] = 1; 
    } else if (type === 5) {
        showBranchChoice();
    } else {
        logMessage(getMonologue());
    }
}

function getMonologue() {
    if (PLAYER.res >= 95) return "……。";
    if (PLAYER.res >= 70) return "鎮める。それだけが義務だ。";
    if (PLAYER.res >= 31) return "前にも、ここで戦ったような……";
    return "灰が静かに降り続ける道。足音は吸い込まれる。";
}

function startLucasBattle() {
    logMessage("白銀騎士ルーカス：『通すわけにはいかぬ……。』");
    drawBattleMenu();
}

function drawBattleMenu() {
    const area = document.getElementById("action-area");
    area.innerHTML = `
        <div class="battle-menu">
            <p style="font-size:0.8rem; color:#888;">（動きを見切り、隙を探せ）</p>
            ${PLAYER.observedCount < 4 ? 
                `<button onclick="lucasAction('observe')">動きを見切る (${PLAYER.observedCount}/4)</button>` :
                `<button onclick="lucasAction('finish')">一撃を与える</button>`
            }
        </div>`;
}

async function lucasAction(type) {
    if (type === 'observe') {
        PLAYER.observedCount++;
        if (PLAYER.observedCount === 1) logMessage("「守りの態勢。だが、剣先が微かに震えている。」");
        else if (PLAYER.observedCount === 3) logMessage("「この構え……幼少期に剣を教わった男と同じだ。」");
        else logMessage(`ルーカスの構えを観察中... (${PLAYER.observedCount}/4)`);
        
        await new Promise(r => setTimeout(r, 600));
        drawBattleMenu();
    } else {
        logMessage("レオンの剣がルーカスの肩を打つ。彼は静かに膝をついた。");
        PLAYER.flags.LUCAS_FOUGHT = true; 
        MAPS["1-1"][5][10] = 1; // 騎士を消去
        
        const area = document.getElementById("action-area");
        area.innerHTML = "……"; // 一時的にボタンを消して演出
        
        await new Promise(r => setTimeout(r, 1500));
        logMessage("「……繰り返すだけの、王よ……。」騎士は消え、門が開いた。");
        
        updateUI(); // 移動ボタンを復活させる
        renderMap();
    }
}

function showBranchChoice() {
    document.getElementById("action-area").innerHTML = `
        <div class="choice-menu">
            <p style="color:#f00; margin-bottom:10px;">― 運命の選択 ―</p>
            <button onclick="alert('商人ルートへ進みます')">商人の気配がする道 (-Res)</button>
            <button onclick="alert('廃墟ルートへ進みます')">廃棄された小路 (+Res)</button>
        </div>`;
}

function updateUI() {
    document.getElementById("p-res").innerText = PLAYER.res + "%";
    
    let stage = "覚醒";
    if (PLAYER.res >= 95) stage = "臨界";
    else if (PLAYER.res >= 70) stage = "浸食";
    else if (PLAYER.res >= 31) stage = "同調";
    document.getElementById("res-stage-name").innerText = `段階: ${stage}`;

    const area = document.getElementById("action-area");
    // 戦闘中や分岐中でなければ、移動ボタンを必ず描画する
    if (!area.querySelector('.battle-menu') && !area.querySelector('.choice-menu')) {
        area.innerHTML = `
            <div class="move-controls">
                <span></span><button onclick="move(0, -1)">▲</button><span></span>
                <button onclick="move(-1, 0)">◀</button><span></span><button onclick="move(1, 0)">▶</button>
                <span></span><button onclick="move(0, 1)">▼</button><span></span>
            </div>`;
    }
}

function toggleMenu() {
    alert(`【レオンの状態】\n共鳴値: ${PLAYER.res}%\n段階: ${document.getElementById("res-stage-name").innerText}\n騎士を退け、門を越えろ。`);
}

function logMessage(msg) { document.getElementById("game-message").innerText = msg; }