/* ==========================================================================
   CV Creator — confetti.js
   Fireworks-style confetti burst on Export click. Canvas-based, self-cleaning.
   ========================================================================== */

const Confetti = (() => {
  let canvas, ctx, running = false, particles = [], anim;

  function init() {
    canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10000';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function burst(x, y) {
    if (!canvas) init();
    const count = 120;
    const colors = ['#B4F204', '#FFD60A', '#FFFFFF', '#1F2937'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18 - 5,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rot: Math.random() * 360,
        rotVel: (Math.random() - 0.5) * 20
      });
    }
    if (!running) {
      running = true;
      loop();
    }
  }

  function loop() {
    if (!ctx) { running = false; return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.6; // gravity
      p.life -= p.decay;
      p.rot += p.rotVel;
      if (p.life > 0) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        particles.splice(i, 1);
      }
    }
    if (alive > 0) {
      anim = requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function stop() {
    running = false;
    if (anim) cancelAnimationFrame(anim);
    particles = [];
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { init, burst, stop };
})();
