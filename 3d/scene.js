(function () {
    var canvas = document.getElementById('bg-canvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.0008);

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 0, 400);

    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var scrollY = 0;
    var clock = new THREE.Clock();

    // ── Starfield particles ─────────────────────────
    var STAR_COUNT = 1200;
    var starGeo = new THREE.BufferGeometry();
    var starPositions = new Float32Array(STAR_COUNT * 3);
    var starSizes = new Float32Array(STAR_COUNT);

    for (var i = 0; i < STAR_COUNT; i++) {
        starPositions[i * 3]     = (Math.random() - 0.5) * 1600;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1600;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 1600;
        starSizes[i] = Math.random() * 2 + 0.5;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    var starMat = new THREE.PointsMaterial({
        color: 0x6c9eff,
        size: 1.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    var stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Floating geometry ───────────────────────────
    var shapes = [];
    var geoTypes = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0)
    ];

    var wireMat = new THREE.MeshBasicMaterial({
        color: 0x6c9eff,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    for (var i = 0; i < 12; i++) {
        var geo = geoTypes[i % geoTypes.length];
        var size = 8 + Math.random() * 20;
        var mesh = new THREE.Mesh(geo, wireMat.clone());
        mesh.scale.set(size, size, size);
        mesh.position.set(
            (Math.random() - 0.5) * 800,
            (Math.random() - 0.5) * 800,
            (Math.random() - 0.5) * 400
        );
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        mesh.userData = {
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.003
            },
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.3 + Math.random() * 0.4,
            floatAmp: 5 + Math.random() * 10,
            baseY: mesh.position.y
        };
        shapes.push(mesh);
        scene.add(mesh);
    }

    // ── Central glowing ring ────────────────────────
    var ringGeo = new THREE.TorusGeometry(50, 0.5, 16, 100);
    var ringMat = new THREE.MeshBasicMaterial({
        color: 0x6c9eff,
        transparent: true,
        opacity: 0.2
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    scene.add(ring);

    var ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(80, 0.3, 16, 120),
        new THREE.MeshBasicMaterial({ color: 0x6c9eff, transparent: true, opacity: 0.08 })
    );
    ring2.rotation.x = Math.PI * 0.3;
    ring2.rotation.z = Math.PI * 0.2;
    scene.add(ring2);

    // ── Reveal observer ─────────────────────────────
    var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(function (el) {
        revealObs.observe(el);
    });

    // ── Events ──────────────────────────────────────
    window.addEventListener('mousemove', function (e) {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', function () {
        scrollY = window.scrollY;
    }, { passive: true });

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── Animate ─────────────────────────────────────
    function animate() {
        requestAnimationFrame(animate);
        var dt = clock.getDelta();
        var elapsed = clock.getElapsedTime();

        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;

        // Camera follows mouse
        camera.position.x = mouse.x * 40;
        camera.position.y = -mouse.y * 30;
        camera.lookAt(0, 0, 0);

        // Scroll shifts camera Z
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        var scrollPct = docH > 0 ? scrollY / docH : 0;
        camera.position.z = 400 - scrollPct * 200;

        // Color shift based on scroll
        var hue = 0.6 + scrollPct * 0.15;
        var shiftColor = new THREE.Color().setHSL(hue, 0.6, 0.55);
        starMat.color = shiftColor;
        ringMat.color = shiftColor;

        // Rotate stars slowly
        stars.rotation.y += 0.0002;
        stars.rotation.x += 0.0001;

        // Rotate rings
        ring.rotation.z += 0.002;
        ring2.rotation.z -= 0.001;
        ring2.rotation.y += 0.0005;

        // Animate floating shapes
        for (var i = 0; i < shapes.length; i++) {
            var m = shapes[i];
            var d = m.userData;
            m.rotation.x += d.rotSpeed.x;
            m.rotation.y += d.rotSpeed.y;
            m.rotation.z += d.rotSpeed.z;
            m.position.y = d.baseY + Math.sin(elapsed * d.floatSpeed + d.floatOffset) * d.floatAmp;
        }

        renderer.render(scene, camera);
    }

    animate();
})();
