(function () {
    var coinCount = 0;
    var score = 0;
    var hudCoins = document.getElementById('hud-coins');
    var hudScore = document.getElementById('hud-score');
    var hudTime = document.getElementById('hud-time');
    var timeLeft = 999;

    function padNum(n, len) {
        var s = String(n);
        while (s.length < len) s = '0' + s;
        return s;
    }

    function updateHUD() {
        hudCoins.textContent = padNum(coinCount, 2);
        hudScore.textContent = padNum(score, 6);
        hudTime.textContent = String(timeLeft);
    }

    // Question block flip
    var qBlocks = document.querySelectorAll('.q-block');
    qBlocks.forEach(function (block) {
        block.addEventListener('click', function () {
            if (block.classList.contains('hit')) return;
            block.classList.add('hit');
            coinCount += 1;
            score += 200;
            updateHUD();
            block.style.animation = 'bump 0.15s ease';
            setTimeout(function () { block.style.animation = ''; }, 150);
        });
    });

    // Pipe toggle
    var pipes = document.querySelectorAll('.pipe[data-open]');
    pipes.forEach(function (pipe) {
        pipe.addEventListener('click', function () {
            var isOpen = pipe.dataset.open === 'true';
            pipes.forEach(function (p) { p.dataset.open = 'false'; });
            if (!isOpen) {
                pipe.dataset.open = 'true';
                score += 100;
                updateHUD();
            }
        });
    });

    // Coin blocks - collect on click
    var coinBlocks = document.querySelectorAll('.coin-block');
    coinBlocks.forEach(function (block) {
        block.addEventListener('click', function () {
            if (block.classList.contains('collected')) return;
            block.classList.add('collected');
            var coins = parseInt(block.dataset.coins || '1', 10);
            coinCount += coins;
            score += coins * 100;
            updateHUD();
        });
    });

    // HUD timer countdown
    var timerInterval = setInterval(function () {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        hudTime.textContent = String(timeLeft);
    }, 1000);

    // Bump keyframe (injected dynamically)
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes bump { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }';
    document.head.appendChild(styleEl);

    updateHUD();
})();
