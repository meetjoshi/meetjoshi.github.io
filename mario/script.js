(function () {
    // ── Canvas Setup ────────────────────────────────
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    var W, H, scale;
    var GAME_W = 800, GAME_H = 450;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        scale = Math.min(W / GAME_W, H / GAME_H);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Game State ──────────────────────────────────
    var started = false;
    var coins = 0;
    var score = 0;
    var timeLeft = 999;
    var camX = 0;

    var TILE = 32;
    var GRAVITY = 0.6;
    var JUMP_FORCE = -10;
    var MOVE_SPEED = 3.5;
    var LEVEL_W = 130;
    var LEVEL_H = 14;
    var GROUND_Y = LEVEL_H - 2;

    // ── Colors ──────────────────────────────────────
    var C = {
        sky: '#6b8cff',
        ground: '#c84c0c',
        groundTop: '#5a9e2e',
        groundLight: '#e09050',
        brick: '#a0522d',
        brickDark: '#7a3a1a',
        blockYellow: '#ffa044',
        blockDark: '#c87020',
        blockLight: '#ffe0a0',
        blockHit: '#8a6030',
        pipeGreen: '#00a800',
        pipeDark: '#006800',
        pipeLight: '#50e850',
        coinGold: '#ffd700',
        coinDark: '#c8a000',
        castleGray: '#b0b0b0',
        castleDark: '#707070',
        white: '#ffffff',
        playerRed: '#e03030',
        playerSkin: '#f0c0a0',
        playerBrown: '#8b4513'
    };

    // ── Input ───────────────────────────────────────
    var keys = {};
    window.addEventListener('keydown', function (e) {
        keys[e.key] = true;
        if (!started && (e.key === 'Enter' || e.key === ' ')) startGame();
        if (e.key === 'Escape') closeInfo();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });

    // Touch controls
    function bindTouch(id, key) {
        var el = document.getElementById(id);
        el.addEventListener('touchstart', function (e) { e.preventDefault(); keys[key] = true; if (!started) startGame(); });
        el.addEventListener('touchend', function (e) { e.preventDefault(); keys[key] = false; });
        el.addEventListener('mousedown', function (e) { keys[key] = true; });
        el.addEventListener('mouseup', function (e) { keys[key] = false; });
    }
    bindTouch('btn-left', 'ArrowLeft');
    bindTouch('btn-right', 'ArrowRight');
    bindTouch('btn-jump', ' ');
    bindTouch('btn-down', 'ArrowDown');

    document.getElementById('start-screen').addEventListener('click', function () { if (!started) startGame(); });

    // ── Player ──────────────────────────────────────
    var player = {
        x: 3 * TILE, y: (GROUND_Y - 2) * TILE,
        w: 20, h: 28,
        vx: 0, vy: 0,
        onGround: false,
        facing: 1,
        frame: 0, frameTimer: 0
    };

    // ── Level Data ──────────────────────────────────
    // Tile types: 0=air, 1=ground, 2=brick, 3=qblock, 4=pipe_tl, 5=pipe_tr, 6=pipe_bl, 7=pipe_br, 8=castle, 9=coin, 10=hit_block
    var level = [];
    function initLevel() {
        level = [];
        for (var y = 0; y < LEVEL_H; y++) {
            level[y] = [];
            for (var x = 0; x < LEVEL_W; x++) {
                if (y >= GROUND_Y) level[y][x] = 1;
                else level[y][x] = 0;
            }
        }

        // Question blocks and bricks (intro area)
        setTile(10, 8, 3); // Q block - name
        setTile(11, 8, 2); // brick
        setTile(12, 8, 3); // Q block - tagline
        setTile(13, 8, 2); // brick
        setTile(14, 8, 3); // Q block - links

        // Floating coins
        placeCoin(18, 9);
        placeCoin(19, 9);
        placeCoin(20, 9);

        // About signpost area - blocks
        setTile(25, 8, 3); // Q block - about
        setTile(26, 8, 2);
        setTile(27, 8, 3); // Q block - about 2

        // Elevated platform
        for (var i = 32; i <= 37; i++) setTile(i, 9, 2);

        // Coins above platform
        placeCoin(33, 7);
        placeCoin(34, 7);
        placeCoin(35, 7);
        placeCoin(36, 7);

        // Pipes (Experience) - each is 2x2
        placePipe(42, 'stealth');
        placePipe(50, 'cyware');
        placePipe(58, 'amazon');

        // Skills blocks
        setTile(65, 8, 3); // Q block - skills
        setTile(67, 6, 3); // Q block - skills2
        setTile(69, 8, 3); // Q block - skills3

        // More coins
        placeCoin(72, 9);
        placeCoin(73, 8);
        placeCoin(74, 7);
        placeCoin(75, 8);
        placeCoin(76, 9);

        // Achievement blocks
        setTile(82, 8, 3); // Q block - achievements
        setTile(85, 6, 3); // Q block - achievements2

        // Staircase
        for (var s = 0; s < 5; s++) {
            for (var sy = 0; sy <= s; sy++) {
                setTile(90 + s, GROUND_Y - 1 - sy, 2);
            }
        }

        // Coins on staircase
        placeCoin(90, GROUND_Y - 3);
        placeCoin(91, GROUND_Y - 4);
        placeCoin(92, GROUND_Y - 5);
        placeCoin(93, GROUND_Y - 6);

        // Gallery blocks
        setTile(100, 8, 3); // Q block - gallery

        // Pipe to education
        placePipe(106, 'education');

        // Final staircase to castle
        for (var s = 0; s < 8; s++) {
            for (var sy = 0; sy <= s; sy++) {
                setTile(112 + s, GROUND_Y - 1 - sy, 2);
            }
        }

        // Castle area
        for (var cx = 122; cx <= 128; cx++) {
            for (var cy = GROUND_Y - 5; cy < GROUND_Y; cy++) {
                setTile(cx, cy, 8);
            }
        }
    }

    function setTile(x, y, t) { if (y >= 0 && y < LEVEL_H && x >= 0 && x < LEVEL_W) level[y][x] = t; }
    function getTile(x, y) { if (y < 0 || y >= LEVEL_H || x < 0 || x >= LEVEL_W) return 0; return level[y][x]; }

    function placeCoin(x, y) { setTile(x, y, 9); }

    var pipes = [];
    function placePipe(x, id) {
        setTile(x, GROUND_Y - 2, 4);
        setTile(x + 1, GROUND_Y - 2, 5);
        setTile(x, GROUND_Y - 1, 6);
        setTile(x + 1, GROUND_Y - 1, 7);
        pipes.push({ x: x, y: GROUND_Y - 2, id: id });
    }

    // Q-block content mapping
    var qblockContents = {};
    var qblockIdx = 0;
    var qblockTypes = ['name', 'tagline', 'links', 'about', 'about2', 'skills', 'skills2', 'skills3', 'achievements', 'achievements2', 'gallery'];

    function assignQBlocks() {
        qblockIdx = 0;
        for (var y = 0; y < LEVEL_H; y++) {
            for (var x = 0; x < LEVEL_W; x++) {
                if (level[y][x] === 3) {
                    var key = x + ',' + y;
                    qblockContents[key] = qblockTypes[qblockIdx] || 'empty';
                    qblockIdx++;
                }
            }
        }
    }

    // Bump animations
    var bumps = [];

    // ── Info Content ────────────────────────────────
    var infoData = {
        name: '<h2>MEET JOSHI</h2><p>Backend engineer turned AI builder. IIT Kharagpur alum.</p>',
        tagline: '<h2>TAGLINE</h2><p>I make machines smarter for a living.</p>',
        links: '<h2>LINKS</h2><ul><li><a href="https://github.com/meetjoshi" target="_blank">GitHub</a></li><li><a href="https://linkedin.com/in/meetjoshi" target="_blank">LinkedIn</a></li><li><a href="mailto:meet.joshi.iitkgp@gmail.com">Email</a></li></ul>',
        about: '<h2>ABOUT</h2><p>I like taking ideas from zero to one - payments systems, AI pipelines, things that scale. Currently building something in stealth.</p>',
        about2: '<h2>BACKGROUND</h2><p>Previously shipped at Amazon and Cyware. I hold a patent, ranked #1 in India at IEEEXtreme, and competed in Google Hash Code and Kick Start.</p>',
        skills: '<h2>LANGUAGES</h2><div class="info-tags"><span class="info-tag">Python</span><span class="info-tag">Java</span><span class="info-tag">C++</span><span class="info-tag">JavaScript</span></div>',
        skills2: '<h2>AI / SYSTEMS</h2><div class="info-tags"><span class="info-tag">LLMs</span><span class="info-tag">System Design</span><span class="info-tag">API Design</span><span class="info-tag">ML Systems</span></div>',
        skills3: '<h2>INFRA</h2><div class="info-tags"><span class="info-tag">AWS</span><span class="info-tag">Docker</span><span class="info-tag">Microservices</span><span class="info-tag">Data Pipelines</span></div>',
        achievements: '<h2>ACHIEVEMENTS</h2><ul><li>#1 India - IEEEXtreme 13.0</li><li>Google Hash Code 2020 - Global</li><li>Google Kick Start - Global</li><li>CodeChef SnackDown 2019</li></ul>',
        achievements2: '<h2>PATENT</h2><p>Low Code API Connector Framework with Dependency Management</p>',
        gallery: '<h2>WORLD MAP</h2><p>Locations explored: Aurora, Cappadocia, Paris, Santorini</p><p>Visit /minimal or /interactive to see the photos!</p>',
        stealth: '<h2>STEALTH AI</h2><h3>Building</h3><p>Payments + AI</p><p>2024 - Present</p>',
        cyware: '<h2>CYWARE</h2><h3>Software Engineer</h3><p>Cybersecurity, AI</p><p>2023 - 2024</p>',
        amazon: '<h2>AMAZON</h2><h3>SDE</h3><p>Advertisement Technology</p><p>2022 - 2023</p>',
        education: '<h2>IIT KHARAGPUR</h2><h3>B.Tech.</h3><p>The tutorial level. Where late-night coding sessions and competitive programming shaped the engineer.</p>',
        castle: '<h2>THANK YOU!</h2><p>But your next project is in another castle!</p><ul><li><a href="https://github.com/meetjoshi" target="_blank">GitHub</a></li><li><a href="https://linkedin.com/in/meetjoshi" target="_blank">LinkedIn</a></li><li><a href="mailto:meet.joshi.iitkgp@gmail.com">Email</a></li></ul>'
    };

    function showInfo(id) {
        var content = infoData[id];
        if (!content) return;
        document.getElementById('info-content').innerHTML = content;
        document.getElementById('info-overlay').classList.remove('hidden');
    }

    function closeInfo() {
        document.getElementById('info-overlay').classList.add('hidden');
    }

    document.getElementById('info-close').addEventListener('click', closeInfo);
    document.getElementById('info-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeInfo();
    });

    // ── HUD ─────────────────────────────────────────
    function updateHUD() {
        document.getElementById('hud-coins').textContent = coins < 10 ? '0' + coins : String(coins);
        document.getElementById('hud-score').textContent = String(score).padStart(6, '0');
        document.getElementById('hud-time').textContent = String(timeLeft);
    }

    // ── Start Game ──────────────────────────────────
    function startGame() {
        if (started) return;
        started = true;
        document.getElementById('start-screen').classList.add('hidden');
        initLevel();
        assignQBlocks();
        player.x = 3 * TILE;
        player.y = (GROUND_Y - 2) * TILE;
        player.vx = 0;
        player.vy = 0;
        coins = 0;
        score = 0;
        timeLeft = 999;
        updateHUD();

        setInterval(function () {
            if (timeLeft > 0) { timeLeft--; updateHUD(); }
        }, 1000);
    }

    // ── Collision helpers ────────────────────────────
    function isSolid(t) { return t === 1 || t === 2 || t === 3 || t === 10 || t === 4 || t === 5 || t === 6 || t === 7 || t === 8; }

    function collidesAt(px, py, pw, ph) {
        var left = Math.floor(px / TILE);
        var right = Math.floor((px + pw - 1) / TILE);
        var top = Math.floor(py / TILE);
        var bottom = Math.floor((py + ph - 1) / TILE);
        for (var ty = top; ty <= bottom; ty++) {
            for (var tx = left; tx <= right; tx++) {
                if (isSolid(getTile(tx, ty))) return true;
            }
        }
        return false;
    }

    function hitBlock(tx, ty) {
        var t = getTile(tx, ty);
        if (t === 3) {
            var key = tx + ',' + ty;
            setTile(tx, ty, 10);
            bumps.push({ x: tx, y: ty, timer: 8, origY: ty * TILE });
            coins++;
            score += 200;
            updateHUD();
            var contentId = qblockContents[key];
            if (contentId) showInfo(contentId);
        } else if (t === 2) {
            bumps.push({ x: tx, y: ty, timer: 8, origY: ty * TILE });
        }
    }

    // ── Update ──────────────────────────────────────
    function update() {
        if (!started) return;

        // Movement
        var moving = false;
        if (keys['ArrowLeft']) { player.vx = -MOVE_SPEED; player.facing = -1; moving = true; }
        else if (keys['ArrowRight']) { player.vx = MOVE_SPEED; player.facing = 1; moving = true; }
        else { player.vx = 0; }

        // Jump
        if ((keys[' '] || keys['ArrowUp']) && player.onGround) {
            player.vy = JUMP_FORCE;
            player.onGround = false;
        }

        // Gravity
        player.vy += GRAVITY;
        if (player.vy > 12) player.vy = 12;

        // Horizontal movement
        var newX = player.x + player.vx;
        if (newX < 0) newX = 0;
        if (newX > (LEVEL_W * TILE - player.w)) newX = LEVEL_W * TILE - player.w;
        if (!collidesAt(newX, player.y, player.w, player.h)) {
            player.x = newX;
        }

        // Vertical movement
        var newY = player.y + player.vy;
        if (!collidesAt(player.x, newY, player.w, player.h)) {
            player.y = newY;
            player.onGround = false;
        } else {
            if (player.vy > 0) {
                player.y = Math.floor((player.y + player.h) / TILE) * TILE - player.h;
                player.onGround = true;
            } else if (player.vy < 0) {
                player.y = Math.floor(player.y / TILE) * TILE + TILE;
                // Hit block above
                var headTX = Math.floor((player.x + player.w / 2) / TILE);
                var headTY = Math.floor((player.y - 1) / TILE);
                hitBlock(headTX, headTY);
            }
            player.vy = 0;
        }

        // Coin collection
        var ptx = Math.floor((player.x + player.w / 2) / TILE);
        var pty = Math.floor((player.y + player.h / 2) / TILE);
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                if (getTile(ptx + dx, pty + dy) === 9) {
                    setTile(ptx + dx, pty + dy, 0);
                    coins++;
                    score += 100;
                    updateHUD();
                }
            }
        }

        // Pipe interaction
        if (keys['ArrowDown']) {
            for (var i = 0; i < pipes.length; i++) {
                var p = pipes[i];
                var px = p.x * TILE;
                var py = p.y * TILE;
                if (player.x + player.w > px && player.x < px + 2 * TILE &&
                    player.y + player.h >= py && player.y + player.h <= py + TILE + 4) {
                    showInfo(p.id);
                    keys['ArrowDown'] = false;
                    break;
                }
            }
        }

        // Castle interaction
        if (getTile(ptx, pty) === 8 || getTile(ptx + 1, pty) === 8) {
            var castleKey = '__castle_shown';
            if (!window[castleKey]) {
                window[castleKey] = true;
                showInfo('castle');
            }
        } else {
            window['__castle_shown'] = false;
        }

        // Animation frame
        if (moving && player.onGround) {
            player.frameTimer++;
            if (player.frameTimer > 6) { player.frameTimer = 0; player.frame = (player.frame + 1) % 3; }
        } else if (!player.onGround) {
            player.frame = 1;
        } else {
            player.frame = 0;
            player.frameTimer = 0;
        }

        // Bump animations
        for (var b = bumps.length - 1; b >= 0; b--) {
            bumps[b].timer--;
            if (bumps[b].timer <= 0) bumps.splice(b, 1);
        }

        // Camera
        camX = player.x - GAME_W / 2 + player.w / 2;
        if (camX < 0) camX = 0;
        if (camX > LEVEL_W * TILE - GAME_W) camX = LEVEL_W * TILE - GAME_W;
    }

    // ── Render ──────────────────────────────────────
    function render() {
        ctx.save();

        // Scale to fit screen
        var ox = (W - GAME_W * scale) / 2;
        var oy = (H - GAME_H * scale) / 2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        // Sky
        ctx.fillStyle = C.sky;
        ctx.fillRect(0, 0, GAME_W, GAME_H);

        // Clouds (parallax)
        drawCloud(100 - camX * 0.3, 50, 60);
        drawCloud(400 - camX * 0.3, 30, 80);
        drawCloud(700 - camX * 0.3, 60, 50);
        drawCloud(1000 - camX * 0.3, 40, 70);
        drawCloud(1500 - camX * 0.3, 55, 60);
        drawCloud(2200 - camX * 0.3, 35, 75);

        // Hills (parallax)
        drawHill(150 - camX * 0.5, GROUND_Y * TILE, 120, 60);
        drawHill(600 - camX * 0.5, GROUND_Y * TILE, 80, 40);
        drawHill(1100 - camX * 0.5, GROUND_Y * TILE, 100, 50);
        drawHill(1800 - camX * 0.5, GROUND_Y * TILE, 130, 65);

        ctx.save();
        ctx.translate(-camX, 0);

        // Tiles
        var startTX = Math.floor(camX / TILE);
        var endTX = Math.ceil((camX + GAME_W) / TILE);
        for (var ty = 0; ty < LEVEL_H; ty++) {
            for (var tx = startTX; tx <= endTX; tx++) {
                var t = getTile(tx, ty);
                var dx = tx * TILE;
                var dy = ty * TILE;

                // Bump offset
                var bumpOff = 0;
                for (var b = 0; b < bumps.length; b++) {
                    if (bumps[b].x === tx && bumps[b].y === ty) {
                        bumpOff = bumps[b].timer > 4 ? -6 : (bumps[b].timer > 0 ? -3 : 0);
                    }
                }

                if (t === 1) drawGround(dx, dy);
                else if (t === 2) drawBrick(dx, dy + bumpOff);
                else if (t === 3) drawQBlock(dx, dy + bumpOff);
                else if (t === 10) drawHitBlock(dx, dy + bumpOff);
                else if (t === 4) drawPipeTL(dx, dy);
                else if (t === 5) drawPipeTR(dx, dy);
                else if (t === 6) drawPipeBL(dx, dy);
                else if (t === 7) drawPipeBR(dx, dy);
                else if (t === 8) drawCastle(dx, dy);
                else if (t === 9) drawCoinTile(dx, dy);
            }
        }

        // Pipe labels
        for (var i = 0; i < pipes.length; i++) {
            var p = pipes[i];
            ctx.fillStyle = '#fff';
            ctx.font = '6px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(p.id.toUpperCase(), p.x * TILE + TILE, p.y * TILE - 6);
        }

        // Player
        drawPlayer(player.x, player.y, player.facing, player.frame, player.onGround);

        ctx.restore();

        // Instructions at top (brief)
        if (started && timeLeft > 990) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '7px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('JUMP INTO ? BLOCKS / DOWN ON PIPES', GAME_W / 2, GAME_H - 20);
        }

        ctx.restore();
    }

    // ── Draw Helpers ────────────────────────────────
    function drawGround(x, y) {
        ctx.fillStyle = C.ground;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = C.groundTop;
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = C.groundLight;
        ctx.fillRect(x + 2, y + 8, 12, 2);
        ctx.fillRect(x + 18, y + 18, 10, 2);
    }

    function drawBrick(x, y) {
        ctx.fillStyle = C.brick;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = C.brickDark;
        ctx.fillRect(x, y + TILE / 2 - 1, TILE, 2);
        ctx.fillRect(x + TILE / 2 - 1, y, 2, TILE);
        ctx.strokeStyle = C.brickDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }

    function drawQBlock(x, y) {
        ctx.fillStyle = C.blockYellow;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = C.blockLight;
        ctx.fillRect(x + 2, y + 2, TILE - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, TILE - 4);
        ctx.fillStyle = C.blockDark;
        ctx.fillRect(x + 2, y + TILE - 4, TILE - 4, 2);
        ctx.fillRect(x + TILE - 4, y + 2, 2, TILE - 4);
        ctx.fillStyle = C.brickDark;
        ctx.font = 'bold 16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + TILE / 2, y + TILE / 2 + 1);
    }

    function drawHitBlock(x, y) {
        ctx.fillStyle = C.blockHit;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = C.blockDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }

    function drawPipeTL(x, y) {
        ctx.fillStyle = C.pipeGreen;
        ctx.fillRect(x - 4, y, TILE + 4, TILE);
        ctx.fillStyle = C.pipeLight;
        ctx.fillRect(x - 4, y, 6, TILE);
        ctx.fillStyle = C.pipeDark;
        ctx.fillRect(x + TILE - 2, y, 2, TILE);
        ctx.fillRect(x - 4, y, TILE + 4, 3);
    }

    function drawPipeTR(x, y) {
        ctx.fillStyle = C.pipeGreen;
        ctx.fillRect(x, y, TILE + 4, TILE);
        ctx.fillStyle = C.pipeDark;
        ctx.fillRect(x + TILE - 2, y, 6, TILE);
        ctx.fillRect(x, y, TILE + 4, 3);
        ctx.fillStyle = C.pipeLight;
        ctx.fillRect(x, y, 2, TILE);
    }

    function drawPipeBL(x, y) {
        ctx.fillStyle = C.pipeGreen;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = C.pipeLight;
        ctx.fillRect(x, y, 4, TILE);
        ctx.fillStyle = C.pipeDark;
        ctx.fillRect(x + TILE - 2, y, 2, TILE);
    }

    function drawPipeBR(x, y) {
        ctx.fillStyle = C.pipeGreen;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = C.pipeDark;
        ctx.fillRect(x + TILE - 4, y, 4, TILE);
        ctx.fillStyle = C.pipeLight;
        ctx.fillRect(x, y, 2, TILE);
    }

    function drawCastle(x, y) {
        ctx.fillStyle = C.castleGray;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = C.castleDark;
        ctx.fillRect(x, y, TILE, 2);
        ctx.fillRect(x, y, 2, TILE);
    }

    function drawCoinTile(x, y) {
        var t = Date.now() / 200;
        var sx = Math.abs(Math.sin(t)) * 0.8 + 0.2;
        ctx.save();
        ctx.translate(x + TILE / 2, y + TILE / 2);
        ctx.scale(sx, 1);
        ctx.fillStyle = C.coinGold;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.coinDark;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.coinGold;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawCloud(x, y, w) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        var h = w * 0.45;
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - w * 0.25, y + h * 0.1, w * 0.3, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w * 0.25, y + h * 0.1, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHill(x, baseY, w, h) {
        ctx.fillStyle = '#4a8c1e';
        ctx.beginPath();
        ctx.ellipse(x, baseY, w / 2, h, 0, Math.PI, 0);
        ctx.fill();
    }

    function drawPlayer(x, y, facing, frame, onGround) {
        ctx.save();
        ctx.translate(x + player.w / 2, y);
        ctx.scale(facing, 1);
        ctx.translate(-player.w / 2, 0);

        // Hat
        ctx.fillStyle = C.playerRed;
        ctx.fillRect(4, 0, 14, 6);
        ctx.fillRect(2, 0, 4, 4);

        // Face
        ctx.fillStyle = C.playerSkin;
        ctx.fillRect(2, 6, 16, 8);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(12, 7, 3, 3);

        // Mustache
        ctx.fillStyle = C.playerBrown;
        ctx.fillRect(8, 11, 10, 3);

        // Body
        ctx.fillStyle = C.playerRed;
        ctx.fillRect(4, 14, 12, 8);

        // Overalls
        ctx.fillStyle = '#2040c0';
        ctx.fillRect(6, 18, 8, 6);

        // Legs
        var legOff = 0;
        if (!onGround) legOff = 2;
        else if (frame === 1) legOff = 2;
        else if (frame === 2) legOff = -2;

        ctx.fillStyle = '#2040c0';
        ctx.fillRect(4, 24, 5, 4);
        ctx.fillRect(11, 24, 5, 4);

        // Shoes
        ctx.fillStyle = C.playerBrown;
        ctx.fillRect(2, 26 + legOff, 7, 2);
        ctx.fillRect(11, 26 - legOff, 7, 2);

        ctx.restore();
    }

    // ── Game Loop ───────────────────────────────────
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    // Show start screen, begin rendering
    gameLoop();
})();
