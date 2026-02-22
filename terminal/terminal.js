(function() {
    const $ = (s) => document.querySelector(s);
    const output = $('#output');
    const inputLine = $('#input-line');
    const mirror = $('#mirror');
    const cmd = $('#cmd');
    const terminal = $('#terminal');
    const canvas = $('#matrix-canvas');

    const state = {
        history: [],
        historyIdx: -1,
        tempInput: '',
        booted: false,
        theme: 'green',
        matrixRunning: false,
    };

    const themes = {
        green:  { fg: '#00ff41', glow: 'rgba(0,255,65,0.3)' },
        amber:  { fg: '#ffb000', glow: 'rgba(255,176,0,0.3)' },
        white:  { fg: '#e0e0e0', glow: 'rgba(224,224,224,0.2)' },
    };

    function setTheme(name) {
        const t = themes[name];
        if (!t) return false;
        state.theme = name;
        document.documentElement.style.setProperty('--fg', t.fg);
        document.documentElement.style.setProperty('--glow', t.glow);
        return true;
    }

    function addOutput(html) {
        const div = document.createElement('div');
        div.className = 'output-block';
        div.innerHTML = html;
        output.appendChild(div);
        scrollToBottom();
    }

    function addCmdEcho(text) {
        const div = document.createElement('div');
        div.className = 'cmd-line';
        div.innerHTML = `<span class="prompt">meet@portfolio:~$ </span>${escHtml(text)}`;
        output.appendChild(div);
    }

    function escHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function scrollToBottom() {
        requestAnimationFrame(() => { terminal.scrollTop = terminal.scrollHeight; });
    }

    function focusInput() {
        cmd.focus({ preventScroll: true });
    }

    // ── Boot Sequence ──────────────────────────────────
    const bootLines = [
        '[boot] BIOS v3.14 .......................... <span class="green">OK</span>',
        '[boot] Loading kernel: meet_joshi.ko ....... <span class="green">OK</span>',
        '[init] Mounting /dev/curiosity .............. <span class="green">OK</span>',
        '[init] Loading modules: python java cpp js . <span class="green">OK</span>',
        '[init] Starting AI subsystem ............... <span class="green">OK</span>',
        '[init] Calibrating creativity engine ....... <span class="green">OK</span>',
        '[sys]  All systems operational.',
        '',
        '<span class="white bold">  "I make machines smarter for a living."</span>',
        '',
        '  Type <span class="accent">help</span> to see available commands.',
    ];

    async function boot() {
        for (const line of bootLines) {
            addOutput(`<span class="dim">${line}</span>`);
            await sleep(140);
        }
        addOutput('');
        inputLine.style.display = 'flex';
        state.booted = true;
        focusInput();
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ── Command Processing ─────────────────────────────
    function processCommand(input) {
        const trimmed = input.trim();
        addCmdEcho(trimmed);

        if (!trimmed) { addOutput(''); return; }

        state.history.push(trimmed);
        state.historyIdx = state.history.length;

        const parts = trimmed.split(/\s+/);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (name === 'sudo') {
            cmdSudo(trimmed);
        } else if (name === 'cd') {
            cmdCd();
        } else if (commands[name]) {
            commands[name](args);
        } else {
            addOutput(`<span class="error">Command not found: ${escHtml(name)}</span>\n  Type <span class="accent">help</span> to see available commands.`);
        }
    }

    // ── Commands ───────────────────────────────────────
    const commands = {};

    commands.help = function() {
        addOutput(
`<span class="accent bold">  Available Commands</span>
<span class="dim">  ─────────────────────────────────────</span>
  <span class="cyan">about</span>          Who I am
  <span class="cyan">experience</span>     Where I've worked
  <span class="cyan">skills</span>         Tech I work with
  <span class="cyan">achievements</span>   Competitive programming & patent
  <span class="cyan">education</span>      Academic background
  <span class="cyan">social</span>         Find me online
  <span class="cyan">gallery</span>        Photo viewer
  <span class="cyan">neofetch</span>       System info card
<span class="dim">  ─────────────────────────────────────</span>
  <span class="cyan">theme</span> <span class="dim">[green|amber|white]</span>
  <span class="cyan">history</span>        Command history
  <span class="cyan">clear</span>          Clear terminal
<span class="dim">  ─────────────────────────────────────</span>
  <span class="dim">Try: whoami, matrix, exit, ls, sudo, cat, vim</span>`);
    };

    commands.about = function() {
        addOutput(
`<span class="accent bold">  About Me</span>
<span class="dim">  ─────────────────────────────────────</span>
  Backend engineer turned AI builder.
  IIT Kharagpur alum.

  I like taking ideas from <span class="white bold">zero to one</span> -
  payments systems, AI pipelines, things
  that scale.

  Currently building something in <span class="accent">stealth</span>.
  Previously shipped at <span class="white">Amazon</span> and <span class="white">Cyware</span>.

  I hold a <span class="accent">patent</span>, ranked <span class="white bold">#1 in India</span>
  at IEEEXtreme, and competed in Google
  Hash Code and Kick Start.

  Always curious, always building.`);
    };

    commands.experience = function() {
        addOutput(
`<span class="accent bold">  Experience</span>
<span class="dim">  ─────────────────────────────────────</span>

  <span class="white bold">▸ Stealth AI</span>                   <span class="dim">Apr 2024 - Present</span>
    Building
    <span class="accent">Payments + AI</span>

  <span class="white bold">▸ Cyware</span>                      <span class="dim">Jun 2023 - Mar 2024</span>
    Software Engineer
    <span class="accent">Cybersecurity, AI</span>

  <span class="white bold">▸ Amazon</span>                      <span class="dim">Jun 2022 - May 2023</span>
    SDE
    <span class="accent">Advertisement Technology</span>`);
    };

    commands.skills = function() {
        const bars = [
            ['LANGUAGES', [
                ['Python',     90],
                ['Java',       80],
                ['C++',        70],
                ['JavaScript', 65],
            ]],
            ['BACKEND', [
                ['System Design',  90],
                ['API Design',     85],
                ['Microservices',  80],
            ]],
            ['AI / ML', [
                ['LLMs',           80],
                ['Data Pipelines', 75],
                ['ML Systems',     70],
            ]],
            ['INFRASTRUCTURE', [
                ['AWS',        80],
                ['Kubernetes', 70],
                ['Docker',     80],
            ]],
        ];

        let out = `<span class="accent bold">  Skills</span>\n<span class="dim">  ─────────────────────────────────────</span>\n`;

        for (const [category, skills] of bars) {
            out += `\n  <span class="white bold">${category}</span>\n`;
            for (const [name, pct] of skills) {
                const total = 20;
                const filled = Math.round(pct / 100 * total);
                const empty = total - filled;
                const bar = `<span class="skill-fill">${'█'.repeat(filled)}</span><span class="skill-empty">${'░'.repeat(empty)}</span>`;
                const label = name.padEnd(16);
                out += `    ${label} ${bar} <span class="dim">${pct}%</span>\n`;
            }
        }
        addOutput(out);
    };

    commands.achievements = function() {
        addOutput(
`<span class="accent bold">  Achievements</span>
<span class="dim">  ─────────────────────────────────────</span>

  <span class="accent">★</span> <span class="white bold">IEEEXtreme 13.0</span>
    <span class="accent">India Rank #1</span> - Global competition

  <span class="accent">★</span> <span class="white bold">Google Hash Code 2020</span>
    Global qualifier

  <span class="accent">★</span> <span class="white bold">Google Kick Start</span>
    Multiple rounds

  <span class="accent">★</span> <span class="white bold">CodeChef SnackDown 2019</span>
    Global competitor

<span class="dim">  ─────────────────────────────────────</span>

  <span class="accent bold">  Patent</span>
  <span class="white">Low Code API Connector Framework</span>
  <span class="white">with Dependency Management</span>`);
    };

    commands.education = function() {
        addOutput(
`<span class="accent bold">  Education</span>
<span class="dim">  ─────────────────────────────────────</span>

  <span class="white bold">Indian Institute of Technology, Kharagpur</span>
  Bachelor of Technology (B.Tech.)`);
    };

    commands.social = function() {
        addOutput(
`<span class="accent bold">  Social</span>
<span class="dim">  ─────────────────────────────────────</span>

  <span class="white bold">GitHub</span>     <a class="link" href="https://github.com/meetjoshi" target="_blank" rel="noopener">github.com/meetjoshi</a>
  <span class="white bold">LinkedIn</span>   <a class="link" href="https://linkedin.com/in/meetjoshi" target="_blank" rel="noopener">linkedin.com/in/meetjoshi</a>`);
    };

    commands.neofetch = function() {
        const palette = [
            ['#ff5555','██'],['#ffb000','██'],['#00ff41','██'],
            ['#00d4ff','██'],['#bd93f9','██'],['#ff79c6','██'],
            ['#f8f8f2','██'],['#555','██'],
        ].map(([c,b]) => `<span style="color:${c}">${b}</span>`).join(' ');

        addOutput(
`  <span class="accent">███    ███</span>    <span class="white bold">meet</span>@<span class="accent">portfolio</span>
  <span class="accent">████  ████</span>    <span class="dim">──────────────────</span>
  <span class="accent">██ ████ ██</span>    <span class="white bold">OS</span>      <span class="green">Human v28</span>
  <span class="accent">██  ██  ██</span>    <span class="white bold">Host</span>    Bengaluru, India
  <span class="accent">██      ██</span>    <span class="white bold">Kernel</span>  IIT Kharagpur
  <span class="accent">██      ██</span>    <span class="white bold">Uptime</span>  3+ yrs in industry
                    <span class="white bold">Shell</span>   Python / Java / C++ / JS
                    <span class="white bold">DE</span>      VS Code
                    <span class="white bold">CPU</span>     Backend + AI Engineer
                    <span class="white bold">GPU</span>     Competitive Programmer
                    <span class="white bold">Patent</span>  API Connector Framework
                    <span class="white bold">Status</span>  <span class="accent">Building in Stealth</span>

                    ${palette}`);
    };

    commands.clear = function() {
        output.innerHTML = '';
    };

    commands.history = function() {
        if (state.history.length === 0) {
            addOutput('<span class="dim">  No commands in history.</span>');
            return;
        }
        let out = '<span class="accent bold">  Command History</span>\n<span class="dim">  ─────────────────────────────────────</span>\n';
        state.history.forEach((h, i) => {
            out += `  <span class="dim">${String(i + 1).padStart(4)}</span>  ${escHtml(h)}\n`;
        });
        addOutput(out);
    };

    commands.theme = function(args) {
        const name = (args[0] || '').toLowerCase();
        if (!name) {
            addOutput(`  Current theme: <span class="accent">${state.theme}</span>\n  Usage: <span class="cyan">theme</span> <span class="dim">[green|amber|white]</span>`);
            return;
        }
        if (setTheme(name)) {
            addOutput(`  Theme set to <span class="accent">${name}</span>`);
        } else {
            addOutput(`<span class="error">  Unknown theme: ${escHtml(name)}</span>\n  Available: <span class="dim">green, amber, white</span>`);
        }
    };

    // ── Easter Eggs ────────────────────────────────────
    commands.whoami = function() {
        addOutput('  <span class="white bold">Meet Joshi</span>\n  <span class="dim">I make machines smarter for a living.</span>');
    };

    commands.exit = function() {
        addOutput('  <span class="accent">Nice try. There is no escape.</span>');
    };

    commands.ls = function() {
        addOutput('  <span class="cyan">about</span>  <span class="cyan">experience</span>  <span class="cyan">skills</span>  <span class="cyan">achievements</span>  <span class="cyan">education</span>  <span class="cyan">social</span>');
    };

    commands.cat = function() {
        addOutput('  <span class="dim">I\'m more of a dog person. 🐕</span>');
    };

    commands.vim = function() {
        addOutput('  <span class="dim">I use VS Code, btw.</span>');
    };

    commands.pwd = function() {
        addOutput('  /home/meet/portfolio');
    };

    commands.date = function() {
        addOutput(`  ${new Date().toString()}`);
    };

    commands.echo = function(args) {
        addOutput('  ' + escHtml(args.join(' ')));
    };

    commands.ping = function() {
        addOutput('  <span class="green">Pong! 🏓</span>');
    };

    commands.matrix = function() {
        if (state.matrixRunning) return;
        startMatrix();
    };

    // ── Gallery ────────────────────────────────────────
    const photos = [
        { file: 'aurora-back-pose.jpg',                       caption: 'Aurora' },
        { file: 'aurora-side-pose.jpg',                       caption: 'Aurora' },
        { file: 'aurora-side-pose-ghibli.jpg',                caption: 'Aurora - Ghibli Edit' },
        { file: 'cappadocia-hot-air-balloons-side-pose.jpg',  caption: 'Cappadocia' },
        { file: 'eiffel-tower-day-front-pose.jpg',            caption: 'Paris - Eiffel Tower' },
        { file: 'eiffel-tower-day-side-pose.jpg',             caption: 'Paris - Eiffel Tower' },
        { file: 'santorini-night-side-pose.jpg',              caption: 'Santorini' },
        { file: 'public-speaking.jpg',                        caption: 'Public Speaking' },
    ];

    const galleryOverlay = $('#gallery-overlay');
    const galleryImg = $('#gallery-img');
    const galleryCaption = $('#gallery-caption');
    const galleryCounter = $('#gallery-counter');
    let galleryIdx = 0;

    function showGalleryPhoto(idx) {
        galleryIdx = ((idx % photos.length) + photos.length) % photos.length;
        const p = photos[galleryIdx];
        galleryImg.src = '../assets/photos/' + p.file;
        galleryImg.alt = p.caption;
        galleryCaption.textContent = p.caption;
        galleryCounter.textContent = (galleryIdx + 1) + ' / ' + photos.length;
    }

    function openGallery(startIdx) {
        showGalleryPhoto(startIdx || 0);
        galleryOverlay.classList.add('active');
    }

    function closeGallery() {
        galleryOverlay.classList.remove('active');
        focusInput();
    }

    $('#gallery-close').addEventListener('click', closeGallery);
    $('#gallery-prev').addEventListener('click', () => showGalleryPhoto(galleryIdx - 1));
    $('#gallery-next').addEventListener('click', () => showGalleryPhoto(galleryIdx + 1));

    galleryOverlay.addEventListener('click', (e) => {
        if (e.target === galleryOverlay) closeGallery();
    });

    let touchStartX = 0;
    galleryOverlay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    galleryOverlay.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
            showGalleryPhoto(galleryIdx + (dx < 0 ? 1 : -1));
        }
    }, { passive: true });

    commands.gallery = function() {
        addOutput(
`<span class="accent bold">  Gallery</span>
<span class="dim">  ─────────────────────────────────────</span>
  Opening photo viewer...
  <span class="dim">← → to navigate · Esc to close · Swipe on mobile</span>`);
        setTimeout(() => openGallery(0), 300);
    };

    function cmdSudo(fullInput) {
        if (fullInput.match(/sudo\s+rm\s+(-rf?\s+\/|\/)/i)) {
            addOutput(
`  <span class="error">☠️  Deleting everything...</span>
  <span class="error">Just kidding.</span>
  <span class="dim">You don't have root here. Nice try though.</span>`);
        } else {
            addOutput('  <span class="error">Permission denied.</span> <span class="dim">You\'re not root here.</span>');
        }
    }

    function cmdCd() {
        addOutput('  <span class="dim">You\'re already at the root of awesome.</span>');
    }

    // ── Matrix Rain ────────────────────────────────────
    function startMatrix() {
        state.matrixRunning = true;
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
        const fontSize = 14;
        const cols = Math.floor(canvas.width / fontSize);
        const drops = new Array(cols).fill(1);

        let frame = 0;
        const maxFrames = 150;

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41';
            ctx.font = fontSize + 'px Fira Code, monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            frame++;
            if (frame < maxFrames) {
                requestAnimationFrame(draw);
            } else {
                fadeOut();
            }
        }

        function fadeOut() {
            let opacity = 1;
            function step() {
                opacity -= 0.05;
                canvas.style.opacity = opacity;
                if (opacity > 0) {
                    requestAnimationFrame(step);
                } else {
                    canvas.style.display = 'none';
                    canvas.style.opacity = 1;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    state.matrixRunning = false;
                    focusInput();
                }
            }
            step();
        }

        draw();
    }

    // ── Tab Completion ─────────────────────────────────
    const cmdNames = Object.keys(commands).sort();

    function tabComplete(partial) {
        if (!partial) return '';
        const lower = partial.toLowerCase();
        const matches = cmdNames.filter(c => c.startsWith(lower));
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) {
            addOutput('  ' + matches.map(m => `<span class="cyan">${m}</span>`).join('  '));
        }
        return partial;
    }

    // ── Input Handling ─────────────────────────────────
    cmd.addEventListener('input', () => {
        mirror.textContent = cmd.value;
    });

    cmd.addEventListener('keydown', (e) => {
        if (!state.booted || galleryOverlay.classList.contains('active')) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            const val = cmd.value;
            cmd.value = '';
            mirror.textContent = '';
            processCommand(val);
            scrollToBottom();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (state.history.length === 0) return;
            if (state.historyIdx === state.history.length) {
                state.tempInput = cmd.value;
            }
            state.historyIdx = Math.max(0, state.historyIdx - 1);
            cmd.value = state.history[state.historyIdx];
            mirror.textContent = cmd.value;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (state.historyIdx >= state.history.length) return;
            state.historyIdx = Math.min(state.history.length, state.historyIdx + 1);
            cmd.value = state.historyIdx === state.history.length
                ? state.tempInput
                : state.history[state.historyIdx];
            mirror.textContent = cmd.value;
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const completed = tabComplete(cmd.value);
            if (completed !== cmd.value) {
                cmd.value = completed;
                mirror.textContent = completed;
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            commands.clear();
        }
    });

    terminal.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') focusInput();
    });

    document.addEventListener('keydown', (e) => {
        if (!galleryOverlay.classList.contains('active')) return;
        if (e.key === 'Escape') { closeGallery(); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { showGalleryPhoto(galleryIdx - 1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { showGalleryPhoto(galleryIdx + 1); e.preventDefault(); }
    });

    // ── Start ──────────────────────────────────────────
    boot();
})();
