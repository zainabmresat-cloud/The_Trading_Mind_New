/**
 * The Trading Mind — Three.js 3D Neural Mind Visualization
 * ==========================================================
 * Classic IIFE script — works with file:// (no ES modules).
 * Requires THREE global from js/vendor/three.min.js loaded first.
 *
 * Exposes:  window.ThreeScene  — the singleton scene controller
 *
 * Emotional States:
 *   FLOW  – Cyan/emerald harmonic waves, calm particles
 *   GREED – Gold/amber expansion, high-energy burst
 *   FEAR  – Crimson contraction, chaotic particles
 *   TILT  – Purple/magenta chaos, angular tumble, spiky displacement
 */

(function () {
  "use strict";

  /* ================================================================
     STATE DEFINITIONS — colours + animation parameters per state
     ================================================================ */
  var STATES = {
    FLOW: {
      label:          "EQUILIBRIUM (FLOW)",
      brainColor:     new THREE.Color(0x00f0ff),
      brainEmissive:  new THREE.Color(0x003344),
      wireColor:      new THREE.Color(0x00ffa3),
      particleColor:  new THREE.Color(0x00e5ff),
      bgFogColor:     new THREE.Color(0x030d14),
      rotSpeedX:      0.0012,
      rotSpeedY:      0.0025,
      pulseAmp:       0.08,
      pulseFreq:      0.8,
      particleSpread: 1.0,
      particleSpeed:  0.6,
      scale:          1.0,
      displace:       0.0,
      tiltJitter:     0.0,
    },
    GREED: {
      label:          "EUPHORIA (GREED)",
      brainColor:     new THREE.Color(0xffd600),
      brainEmissive:  new THREE.Color(0x332200),
      wireColor:      new THREE.Color(0xff9900),
      particleColor:  new THREE.Color(0xffbb00),
      bgFogColor:     new THREE.Color(0x0d0800),
      rotSpeedX:      0.003,
      rotSpeedY:      0.006,
      pulseAmp:       0.22,
      pulseFreq:      2.2,
      particleSpread: 1.65,
      particleSpeed:  2.0,
      scale:          1.18,
      displace:       0.0,
      tiltJitter:     0.0,
    },
    FEAR: {
      label:          "PANIC (FEAR)",
      brainColor:     new THREE.Color(0xff3366),
      brainEmissive:  new THREE.Color(0x330011),
      wireColor:      new THREE.Color(0xff0033),
      particleColor:  new THREE.Color(0xff5577),
      bgFogColor:     new THREE.Color(0x0d0005),
      rotSpeedX:      0.0005,
      rotSpeedY:      0.001,
      pulseAmp:       0.04,
      pulseFreq:      3.5,
      particleSpread: 0.55,
      particleSpeed:  3.5,
      scale:          0.78,
      displace:       0.0,
      tiltJitter:     0.0,
    },
    TILT: {
      label:          "FULL TILT (CHAOS)",
      brainColor:     new THREE.Color(0xa855f7),
      brainEmissive:  new THREE.Color(0x220033),
      wireColor:      new THREE.Color(0xff00cc),
      particleColor:  new THREE.Color(0xcc44ff),
      bgFogColor:     new THREE.Color(0x08000d),
      rotSpeedX:      0.009,
      rotSpeedY:      0.013,
      pulseAmp:       0.35,
      pulseFreq:      5.5,
      particleSpread: 1.4,
      particleSpeed:  4.5,
      scale:          1.05,
      displace:       0.28,
      tiltJitter:     0.012,
    },
  };

  /* ================================================================
     LERP HELPERS
     ================================================================ */
  function lerpNum(a, b, t) { return a + (b - a) * t; }
  function lerpColor(out, a, b, t) {
    out.r = lerpNum(a.r, b.r, t);
    out.g = lerpNum(a.g, b.g, t);
    out.b = lerpNum(a.b, b.b, t);
  }

  /* ================================================================
     ThreeScene CLASS
     ================================================================ */
  function ThreeScene(containerId) {
    this.containerId = containerId;
    this.container   = null;
    this.renderer    = null;
    this.scene       = null;
    this.camera      = null;
    this.clock       = new THREE.Clock();

    // Geometry objects
    this.brainMesh      = null;
    this.brainWire      = null;
    this.innerSphere    = null;
    this.particleSystem = null;
    this.ringMeshes     = [];

    // Stored original vertex positions (for displacement)
    this.brainOrigPositions = null;
    this.brainGeo           = null;

    // State machine
    this.currentStateName = "FLOW";
    this.targetStateName  = "FLOW";
    this.lerpT            = 1.0;         // 1 = fully at target, 0 = at source
    this.transitionSpeed  = 0.025;       // per-frame lerp step

    // Current live values (lerped)
    this.liveState = JSON.parse(JSON.stringify({
      rotSpeedX:      STATES.FLOW.rotSpeedX,
      rotSpeedY:      STATES.FLOW.rotSpeedY,
      pulseAmp:       STATES.FLOW.pulseAmp,
      pulseFreq:      STATES.FLOW.pulseFreq,
      particleSpread: STATES.FLOW.particleSpread,
      particleSpeed:  STATES.FLOW.particleSpeed,
      scale:          STATES.FLOW.scale,
      displace:       STATES.FLOW.displace,
      tiltJitter:     STATES.FLOW.tiltJitter,
    }));
    this.liveColor       = new THREE.Color(STATES.FLOW.brainColor);
    this.liveEmissive    = new THREE.Color(STATES.FLOW.brainEmissive);
    this.liveWireColor   = new THREE.Color(STATES.FLOW.wireColor);
    this.liveParticle    = new THREE.Color(STATES.FLOW.particleColor);
    this.liveSourceState = null;    // snapshot at transition start

    // Mouse orbit
    this.isOrbiting   = false;
    this.lastMouseX   = 0;
    this.lastMouseY   = 0;
    this.orbitPhi     = Math.PI / 2.5;
    this.orbitTheta   = 0;
    this.orbitRadius  = 5.5;
    this.minRadius    = 3.0;
    this.maxRadius    = 10.0;

    // Animation loop control
    this.active = false;   // only renders when Slide 3 is visible
    this.rafId  = null;

    // Particle base offsets (for orbit calculation)
    this.particleOffsets = null;

    this.init();
  }

  ThreeScene.prototype.init = function () {
    var self = this;
    this.container = document.getElementById(this.containerId);
    if (!this.container) { console.warn("[ThreeScene] Container not found:", this.containerId); return; }

    // Clear placeholder text
    this.container.innerHTML = "";

    var W = this.container.clientWidth  || 800;
    var H = this.container.clientHeight || 480;

    /* ---- Renderer ---- */
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x070a0f, 1);
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    /* ---- Scene ---- */
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070a0f, 0.045);

    /* ---- Camera ---- */
    this.camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    this._updateCameraPosition();

    /* ---- Lighting ---- */
    var ambient = new THREE.AmbientLight(0x112233, 1.2);
    this.scene.add(ambient);

    var pointCyan = new THREE.PointLight(0x00f0ff, 3.5, 12);
    pointCyan.position.set(3, 2, 3);
    this.scene.add(pointCyan);
    this.pointCyan = pointCyan;

    var pointWarm = new THREE.PointLight(0xffa020, 2.0, 10);
    pointWarm.position.set(-3, -2, -2);
    this.scene.add(pointWarm);
    this.pointWarm = pointWarm;

    var pointBack = new THREE.PointLight(0x6600aa, 1.5, 8);
    pointBack.position.set(0, -3, -4);
    this.scene.add(pointBack);
    this.pointBack = pointBack;

    /* ---- Build scene objects ---- */
    this._buildBrainMesh();
    this._buildParticles();
    this._buildRings();
    this._buildStarField();

    /* ---- Events ---- */
    this._bindEvents();

    /* ---- Slide lifecycle via deck:slidechange ---- */
    document.addEventListener("deck:slidechange", function (e) {
      if (e.detail.slideNumber === 3) {
        self.resume();
      } else {
        self.pause();
      }
    });

    /* ---- State button wiring ---- */
    var pills = document.querySelectorAll(".pill-selector .pill-option");
    pills.forEach(function (btn) {
      btn.addEventListener("click", function () {
        pills.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        self.setState(btn.getAttribute("data-state"));
      });
    });

    console.log("[ThreeScene] Initialized successfully.");
  };

  /* ---- Brain Geometry ---- */
  ThreeScene.prototype._buildBrainMesh = function () {
    // Icosahedron detail 4 gives 1280 triangles — enough for smooth organic look
    var geo = new THREE.IcosahedronGeometry(1.6, 4);
    this.brainGeo = geo;

    // Store original vertex positions for displacement
    var pos = geo.attributes.position;
    this.brainOrigPositions = new Float32Array(pos.array.length);
    for (var i = 0; i < pos.array.length; i++) {
      this.brainOrigPositions[i] = pos.array[i];
    }

    // Brain surface material — Phong with custom colour
    var mat = new THREE.MeshPhongMaterial({
      color:     STATES.FLOW.brainColor,
      emissive:  STATES.FLOW.brainEmissive,
      shininess: 80,
      transparent: true,
      opacity: 0.82,
      side: THREE.FrontSide,
    });
    this.brainMat = mat;

    this.brainMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.brainMesh);

    // Wireframe overlay
    var wireGeo = new THREE.WireframeGeometry(geo);
    var wireMat = new THREE.LineBasicMaterial({
      color: STATES.FLOW.wireColor,
      transparent: true,
      opacity: 0.18,
    });
    this.wireMat = wireMat;
    this.brainWire = new THREE.LineSegments(wireGeo, wireMat);
    this.scene.add(this.brainWire);

    // Glowing inner sphere (the core)
    var innerGeo = new THREE.SphereGeometry(0.72, 32, 32);
    var innerMat = new THREE.MeshPhongMaterial({
      color:       0x003344,
      emissive:    0x001122,
      transparent: true,
      opacity:     0.55,
    });
    this.innerMat  = innerMat;
    this.innerSphere = new THREE.Mesh(innerGeo, innerMat);
    this.scene.add(this.innerSphere);
  };

  /* ---- Particle System ---- */
  ThreeScene.prototype._buildParticles = function () {
    var COUNT = 1800;
    var positions = new Float32Array(COUNT * 3);
    var offsets   = [];   // spherical coords [r, phi, theta]

    for (var i = 0; i < COUNT; i++) {
      var r     = 2.2 + Math.random() * 1.8;
      var phi   = Math.acos(2 * Math.random() - 1);
      var theta = Math.random() * Math.PI * 2;

      offsets.push(r, phi, theta);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    this.particleOffsets = offsets;

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.particleGeo = geo;

    var mat = new THREE.PointsMaterial({
      color:       STATES.FLOW.particleColor,
      size:        0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity:     0.75,
    });
    this.particleMat = mat;

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  };

  /* ---- Orbital Rings ---- */
  ThreeScene.prototype._buildRings = function () {
    var ringDefs = [
      { radius: 2.3,  tube: 0.008, color: 0x00f0ff, rot: { x: 0.4, y: 0, z: 0 } },
      { radius: 2.8,  tube: 0.006, color: 0x00ffa3, rot: { x: 0,   y: 0, z: 0.9 } },
      { radius: 3.3,  tube: 0.005, color: 0x004466, rot: { x: 1.2, y: 0.3, z: 0 } },
    ];

    var self = this;
    ringDefs.forEach(function (def, idx) {
      var geo = new THREE.TorusGeometry(def.radius, def.tube, 8, 120);
      var mat = new THREE.MeshBasicMaterial({
        color:       def.color,
        transparent: true,
        opacity:     0.4,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = def.rot.x;
      mesh.rotation.y = def.rot.y;
      mesh.rotation.z = def.rot.z;
      self.scene.add(mesh);
      self.ringMeshes.push({ mesh: mesh, mat: mat, baseRot: JSON.parse(JSON.stringify(def.rot)), idx: idx });
    });
  };

  /* ---- Background star field ---- */
  ThreeScene.prototype._buildStarField = function () {
    var COUNT = 500;
    var positions = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: 0x334455, size: 0.07, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  };

  /* ---- Mouse / Touch orbit events ---- */
  ThreeScene.prototype._bindEvents = function () {
    var self    = this;
    var canvas  = this.renderer.domElement;

    canvas.addEventListener("mousedown", function (e) {
      self.isOrbiting = true;
      self.lastMouseX = e.clientX;
      self.lastMouseY = e.clientY;
    });
    window.addEventListener("mouseup",   function () { self.isOrbiting = false; });
    window.addEventListener("mousemove", function (e) {
      if (!self.isOrbiting) return;
      var dx = (e.clientX - self.lastMouseX) * 0.005;
      var dy = (e.clientY - self.lastMouseY) * 0.005;
      self.orbitTheta += dx;
      self.orbitPhi    = Math.max(0.2, Math.min(Math.PI - 0.2, self.orbitPhi + dy));
      self.lastMouseX  = e.clientX;
      self.lastMouseY  = e.clientY;
      self._updateCameraPosition();
    });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.orbitRadius += e.deltaY * 0.01;
      self.orbitRadius = Math.max(self.minRadius, Math.min(self.maxRadius, self.orbitRadius));
      self._updateCameraPosition();
    }, { passive: false });

    // Touch orbit
    var lastTouchX = 0, lastTouchY = 0;
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (e.touches.length === 1) {
        var dx = (e.touches[0].clientX - lastTouchX) * 0.006;
        var dy = (e.touches[0].clientY - lastTouchY) * 0.006;
        self.orbitTheta += dx;
        self.orbitPhi    = Math.max(0.2, Math.min(Math.PI - 0.2, self.orbitPhi + dy));
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        self._updateCameraPosition();
      }
    }, { passive: true });

    // Responsive resize
    window.addEventListener("resize", function () { self._onResize(); });
  };

  ThreeScene.prototype._updateCameraPosition = function () {
    if (!this.camera) return;
    var r = this.orbitRadius;
    this.camera.position.set(
      r * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta),
      r * Math.cos(this.orbitPhi),
      r * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta)
    );
    this.camera.lookAt(0, 0, 0);
  };

  ThreeScene.prototype._onResize = function () {
    if (!this.container || !this.renderer || !this.camera) return;
    var W = this.container.clientWidth;
    var H = this.container.clientHeight;
    if (W < 10 || H < 10) return;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  };

  /* ---- State machine ---- */
  ThreeScene.prototype.setState = function (stateName) {
    if (!STATES[stateName]) return;
    if (stateName === this.targetStateName) return;

    // Snapshot the current live values as the lerp source
    this.liveSourceState = {
      rotSpeedX:      this.liveState.rotSpeedX,
      rotSpeedY:      this.liveState.rotSpeedY,
      pulseAmp:       this.liveState.pulseAmp,
      pulseFreq:      this.liveState.pulseFreq,
      particleSpread: this.liveState.particleSpread,
      particleSpeed:  this.liveState.particleSpeed,
      scale:          this.liveState.scale,
      displace:       this.liveState.displace,
      tiltJitter:     this.liveState.tiltJitter,
    };
    this.liveSourceColor    = new THREE.Color(this.liveColor);
    this.liveSourceEmissive = new THREE.Color(this.liveEmissive);
    this.liveSourceWire     = new THREE.Color(this.liveWireColor);
    this.liveSourceParticle = new THREE.Color(this.liveParticle);

    this.targetStateName  = stateName;
    this.lerpT            = 0.0;

    // Update HUD
    var hud = document.getElementById("three-hud-state");
    if (hud) hud.textContent = STATES[stateName].label;
  };

  /* ---- Animation helpers ---- */
  ThreeScene.prototype._updateBrainVertices = function (elapsed) {
    if (!this.brainGeo || !this.brainOrigPositions) return;

    var pos      = this.brainGeo.attributes.position;
    var orig     = this.brainOrigPositions;
    var amp      = this.liveState.pulseAmp;
    var freq     = this.liveState.pulseFreq;
    var displace = this.liveState.displace;

    for (var i = 0; i < pos.count; i++) {
      var i3 = i * 3;
      var ox = orig[i3], oy = orig[i3 + 1], oz = orig[i3 + 2];
      var len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;

      // Wave displacement along normal
      var wave = amp * Math.sin(freq * elapsed + ox * 2.5 + oy * 1.8 + oz * 1.3);

      // TILT spike displacement: random spikes in direction of vertex normal
      var spike = displace * (Math.abs(Math.sin(elapsed * 7.0 + i * 0.4)) - 0.3);

      var factor = 1.0 + wave + Math.max(0, spike);
      pos.array[i3]     = ox * factor;
      pos.array[i3 + 1] = oy * factor;
      pos.array[i3 + 2] = oz * factor;
    }
    pos.needsUpdate = true;
    this.brainGeo.computeVertexNormals();
  };

  ThreeScene.prototype._updateParticles = function (elapsed) {
    if (!this.particleGeo || !this.particleOffsets) return;

    var pos     = this.particleGeo.attributes.position;
    var offsets = this.particleOffsets;
    var spread  = this.liveState.particleSpread;
    var speed   = this.liveState.particleSpeed;
    var n       = pos.count;

    for (var i = 0; i < n; i++) {
      var i3  = i * 3;
      var ob  = i * 3; // offset buffer index same as position
      var r     = offsets[ob]     * spread;
      var phi   = offsets[ob + 1];
      var theta = offsets[ob + 2] + elapsed * speed * 0.07 * (1 + (i % 5) * 0.1);

      // FEAR: particles contract toward origin with oscillation
      if (this.targetStateName === "FEAR" && this.lerpT > 0.5) {
        r = offsets[ob] * spread * (0.65 + 0.35 * Math.abs(Math.sin(elapsed * 3 + i)));
      }

      pos.array[i3]     = r * Math.sin(phi) * Math.cos(theta);
      pos.array[i3 + 1] = r * Math.cos(phi) + 0.15 * Math.sin(elapsed * 1.2 + i * 0.2);
      pos.array[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    pos.needsUpdate = true;
  };

  ThreeScene.prototype._lerpToTarget = function () {
    if (this.lerpT >= 1.0 || !this.liveSourceState) return;

    this.lerpT = Math.min(1.0, this.lerpT + this.transitionSpeed);
    var t  = this.lerpT;
    var S  = this.liveSourceState;
    var T  = STATES[this.targetStateName];

    // Numeric params
    this.liveState.rotSpeedX      = lerpNum(S.rotSpeedX,      T.rotSpeedX,      t);
    this.liveState.rotSpeedY      = lerpNum(S.rotSpeedY,      T.rotSpeedY,      t);
    this.liveState.pulseAmp       = lerpNum(S.pulseAmp,       T.pulseAmp,       t);
    this.liveState.pulseFreq      = lerpNum(S.pulseFreq,      T.pulseFreq,      t);
    this.liveState.particleSpread = lerpNum(S.particleSpread, T.particleSpread, t);
    this.liveState.particleSpeed  = lerpNum(S.particleSpeed,  T.particleSpeed,  t);
    this.liveState.scale          = lerpNum(S.scale,          T.scale,          t);
    this.liveState.displace       = lerpNum(S.displace,       T.displace,       t);
    this.liveState.tiltJitter     = lerpNum(S.tiltJitter,     T.tiltJitter,     t);

    // Colours
    lerpColor(this.liveColor,    this.liveSourceColor,    T.brainColor,    t);
    lerpColor(this.liveEmissive, this.liveSourceEmissive, T.brainEmissive, t);
    lerpColor(this.liveWireColor,this.liveSourceWire,     T.wireColor,     t);
    lerpColor(this.liveParticle, this.liveSourceParticle, T.particleColor, t);
  };

  /* ---- Main Render Loop ---- */
  ThreeScene.prototype._tick = function () {
    if (!this.active) return;
    var self    = this;
    this.rafId  = requestAnimationFrame(function () { self._tick(); });

    var elapsed = this.clock.getElapsedTime();
    var delta   = this.clock.getDelta ? 0.016 : 0.016;

    // State lerp
    this._lerpToTarget();

    // Apply live colours to materials
    if (this.brainMat) {
      this.brainMat.color.copy(this.liveColor);
      this.brainMat.emissive.copy(this.liveEmissive);
    }
    if (this.wireMat) {
      this.wireMat.color.copy(this.liveWireColor);
    }
    if (this.particleMat) {
      this.particleMat.color.copy(this.liveParticle);
    }

    // Scale brain
    var sc = this.liveState.scale;
    if (this.brainMesh) {
      this.brainMesh.scale.setScalar(sc);
      this.brainWire.scale.setScalar(sc);
      this.innerSphere.scale.setScalar(sc);
    }

    // Brain rotation
    if (this.brainMesh) {
      var jitter = this.liveState.tiltJitter;
      var jx = jitter > 0 ? jitter * (Math.random() - 0.5) : 0;
      var jy = jitter > 0 ? jitter * (Math.random() - 0.5) : 0;
      this.brainMesh.rotation.x += this.liveState.rotSpeedX + jx;
      this.brainMesh.rotation.y += this.liveState.rotSpeedY + jy;
      this.brainWire.rotation.copy(this.brainMesh.rotation);
    }

    // Animate brain vertices (wave)
    this._updateBrainVertices(elapsed);

    // Animate particles
    this._updateParticles(elapsed);

    // Ring rotations
    this.ringMeshes.forEach(function (r, idx) {
      r.mesh.rotation.y += (0.001 + idx * 0.0005) * self.liveState.particleSpeed * 0.3;
      r.mesh.rotation.z += (0.0007 + idx * 0.0003) * self.liveState.particleSpeed * 0.3;
    });

    // Pulsing lights
    var pulse = Math.sin(elapsed * this.liveState.pulseFreq * 1.2) * 0.5 + 0.5;
    if (this.pointCyan) {
      this.pointCyan.color.copy(this.liveColor);
      this.pointCyan.intensity = 2.5 + pulse * 2.0;
    }
    if (this.pointBack) {
      this.pointBack.color.copy(this.liveParticle);
      this.pointBack.intensity = 1.0 + pulse * 1.5;
    }

    // Fog colour
    var fogTarget = STATES[this.targetStateName].bgFogColor;
    if (this.scene.fog) {
      lerpColor(this.scene.fog.color, this.scene.fog.color, fogTarget, 0.03);
    }

    this.renderer.render(this.scene, this.camera);
  };

  ThreeScene.prototype.resume = function () {
    if (this.active) return;
    this.active = true;
    this.clock.start();
    this._onResize();
    this._tick();
    console.log("[ThreeScene] Rendering resumed.");
  };

  ThreeScene.prototype.pause = function () {
    this.active = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  };

  /* ---- Bootstrap ---- */
  ThreeScene.prototype.start = function () {
    // Auto-resume if Slide 3 is already active on load
    var slide3 = document.getElementById("slide-3");
    if (slide3 && slide3.classList.contains("active")) {
      this.resume();
    }
  };

  /* ================================================================
     SINGLETON FACTORY
     ================================================================ */
  function initThreeScene() {
    if (typeof THREE === "undefined") {
      console.error("[ThreeScene] THREE not found. Ensure js/vendor/three.min.js is loaded first.");
      return null;
    }
    var scene = new ThreeScene("three-container");
    scene.start();
    window.ThreeScene = scene;
    return scene;
  }

  // Auto-init after DOM ready
  function ready(fn) {
    if (document.readyState !== "loading") { fn(); }
    else { document.addEventListener("DOMContentLoaded", fn); }
  }

  ready(function () { initThreeScene(); });

})();
