import * as THREE from 'three';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// Audio & Entry Overlay Setup
// ==========================================
const bgAudio = new Audio('./sounds/bg.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.5;

const hoverAudio = new Audio('./sounds/hover.mp3');
hoverAudio.volume = 0.4;

const clickAudio = new Audio('./sounds/click.mp3');
clickAudio.volume = 0.6;

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('entry-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      // Fullscreen
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log(err));
      }
      
      // Play background audio
      bgAudio.play().catch(e => console.log('Audio play failed:', e));
      
      // Hide overlay
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.visibility = 'hidden', 1000);
    });
  }

  // Hover and Click sounds for interactive elements
  const interactives = document.querySelectorAll('.project-card, .btn-primary, .btn-secondary, a, .glitch-vintage');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      hoverAudio.currentTime = 0;
      hoverAudio.play().catch(e => {});
    });
    el.addEventListener('click', () => {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(e => {});
    });
  });
});

// ==========================================
// Smooth Scroll Setup (Lenis)
// ==========================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ==========================================
// Cinematic Intro Sequence (GSAP ScrollTrigger)
// ==========================================
const introSequence = document.getElementById('intro-sequence');
if (introSequence) {
  // Global object to track explosion progress via GSAP
  window.explodeAnim = { progress: 0 };

  const introTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#intro-sequence',
      start: 'top top',
      end: '+=1000%', // 10 scrolls for long complex timeline
      scrub: 1,
      pin: true,
      anticipatePin: 1
    }
  });

  // Setup initial states
  gsap.set('.intro-text-container', { left: '10%', xPercent: 0, opacity: 1 });
  gsap.set('#avatar-container', { left: '75%', autoAlpha: 1 });
  gsap.set('.speech-bubble', { scale: 0.5, autoAlpha: 0 }); 
  
  // 1. Scene 1: Initial state is already set (text left, avatar right). Wait a tiny bit.
  introTl.to({}, { duration: 0.5 });
  
  // 2. Speech bubbles pop up one by one with a bounce effect
  introTl.to('#box-1', { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" })
         .to('#box-2', { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" })
         .to('#box-3', { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });
         
  // 3. Hold for reading
  introTl.to({}, { duration: 2 });
  
  // 4. Bubbles and Text fade out
  introTl.to(['.intro-text-container', '.speech-bubble'], { autoAlpha: 0, duration: 1 });
  
  // 5. Avatar slides to center
  introTl.to('#avatar-container', { left: '50%', duration: 1.5, ease: "power2.inOut" });
  
  // 6. Image breaks into pixels (we animate window.explodeAnim.progress)
  introTl.to(window.explodeAnim, { progress: 80, duration: 2 });
  
  // 7. Fade out the explosion canvas itself COMPLETELY
  introTl.to('#explosion-canvas', { autoAlpha: 0, duration: 1 })
         .to('#avatar-container', { autoAlpha: 0, duration: 0.1 }, '<');
}

// ==========================================
// Animations (GSAP)
// ==========================================
const panels = document.querySelectorAll('.panel');
panels.forEach((panel) => {
  gsap.fromTo(
    panel.querySelectorAll('.stereo-card, .glass-card'),
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: panel,
        start: 'top 80%',
      },
    }
  );
});

// ==========================================
// WebGL Liquid Distortion (Three.js)
// ==========================================
const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Shaders for liquid mouse distortion
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  
  varying vec2 vUv;

  // Simple noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;

    // Mouse interaction
    vec2 mouse = uMouse;
    mouse.x *= uResolution.x / uResolution.y;
    
    float dist = distance(st, mouse);
    float mouseEffect = smoothstep(0.3, 0.0, dist);

    // Liquid animation
    vec2 pos = st * 3.0;
    float n = snoise(pos + uTime * 0.2 + mouseEffect * 2.0);
    
    // Background color: deep dark minimal (#0a0a0a) to slightly lighter
    vec3 colorBase = vec3(0.04, 0.04, 0.04);
    
    // Accent gold color for liquid highlights
    vec3 colorGold = vec3(0.78, 0.65, 0.29); 
    
    // Mix based on noise and mouse proximity
    vec3 finalColor = mix(colorBase, colorBase * 1.5, n);
    finalColor += colorGold * mouseEffect * 0.15; // Subtle gold glow near mouse
    finalColor += vec3(n * 0.05); // Subtle texture

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Mouse tracking
let targetMouse = new THREE.Vector2(0.5, 0.5);
let currentMouse = new THREE.Vector2(0.5, 0.5);

window.addEventListener('mousemove', (e) => {
  targetMouse.x = e.clientX / window.innerWidth;
  targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

// UI Interactions (Cursor & Spotlight)
const cursor = document.querySelector('.custom-cursor');
const links = document.querySelectorAll('a, button');
const stereoCards = document.querySelectorAll('.stereo-card');

let clientX = -100;
let clientY = -100;

window.addEventListener('mousemove', (e) => {
  clientX = e.clientX;
  clientY = e.clientY;
});

links.forEach(link => {
  link.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  link.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

function animate() {
  requestAnimationFrame(animate);
  
  // Smooth mouse interpolation for WebGL
  currentMouse.lerp(targetMouse, 0.1);
  
  material.uniforms.uTime.value = clock.getElapsedTime();
  material.uniforms.uMouse.value.copy(currentMouse);
  
  renderer.render(scene, camera);

  // Update Custom Cursor
  if (cursor) {
    cursor.style.left = clientX + 'px';
    cursor.style.top = clientY + 'px';
  }

  // Update Spotlight Cards
  stereoCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
}

animate();

// 3D Tilt Magnet Effect
const tiltCards = document.querySelectorAll('.tilt-card');
tiltCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (-10 to 10 degrees)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  });
});

// Modal Logic
const readMoreBtns = document.querySelectorAll('.read-more-btn');
const modals = document.querySelectorAll('.modal-overlay');
const closeBtns = document.querySelectorAll('.modal-close');

readMoreBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(btn.getAttribute('data-modal'));
    if (target) target.classList.add('active');
  });
});

closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal-overlay').classList.remove('active');
  });
});

modals.forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
});

// Also bind links dynamically to the custom cursor
const allLinks = document.querySelectorAll('a, button, .read-more-btn');
allLinks.forEach(link => {
  link.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  link.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// --- Avatar Canvas (Background Removal, 3D Tilt & Pixel Explosion) ---
const avatarCanvas = document.getElementById('avatar-canvas');
if (avatarCanvas) {
  const ctx = avatarCanvas.getContext('2d', { willReadFrequently: true });
  const img = new Image();
  img.src = '/avatar.jpg';
  
  let particles = [];
  let originalImageData = null;
  const particleStep = 4; // optimization: every 4th pixel
  
  img.onload = () => {
    avatarCanvas.width = img.width;
    avatarCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Pixel manipulation to remove white background
    const imageData = ctx.getImageData(0, 0, avatarCanvas.width, avatarCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      if (r > 230 && g > 230 && b > 230) {
        data[i+3] = 0;
      } else {
        // Create particle data for explosion
        const x = (i / 4) % avatarCanvas.width;
        const y = Math.floor((i / 4) / avatarCanvas.width);
        if (x % particleStep === 0 && y % particleStep === 0) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15 + 5; // Organic varied speeds
          particles.push({
            originX: x,
            originY: y,
            color: `rgba(${r},${g},${b},${data[i+3]})`,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
          });
        }
      }
    }
    originalImageData = imageData;
    ctx.putImageData(imageData, 0, 0);
  };

  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  let isIdle = true, idleTime = 0, idleTimeout;

  window.addEventListener('mousemove', (e) => {
    isIdle = false;
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => isIdle = true, 2000);

    const rect = avatarCanvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    targetRotY = ((e.clientX - centerX) / window.innerWidth) * 50; 
    targetRotX = ((centerY - e.clientY) / window.innerHeight) * 50;
  });

  idleTimeout = setTimeout(() => isIdle = true, 2000);

  const explosionCanvas = document.getElementById('explosion-canvas');
  let expCtx = null;
  if (explosionCanvas) {
    explosionCanvas.width = window.innerWidth;
    explosionCanvas.height = window.innerHeight;
    expCtx = explosionCanvas.getContext('2d');
    
    window.addEventListener('resize', () => {
      explosionCanvas.width = window.innerWidth;
      explosionCanvas.height = window.innerHeight;
    });
  }

  function animateAvatar() {
    requestAnimationFrame(animateAvatar);
    
    // 1. Draw based on explosion progress
    const explodeProgress = window.explodeAnim ? window.explodeAnim.progress : 0;
    
    if (explodeProgress > 0 && expCtx) {
      // Clear main avatar canvas
      ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
      // Clear explosion canvas
      expCtx.clearRect(0, 0, explosionCanvas.width, explosionCanvas.height);
      
      // Get exact screen position of the avatar canvas
      const rect = avatarCanvas.getBoundingClientRect();
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Translate local particle origin to global screen coordinates
        const startX = rect.left + (p.originX * (rect.width / avatarCanvas.width));
        const startY = rect.top + (p.originY * (rect.height / avatarCanvas.height));
        
        const currentX = startX + (p.vx * explodeProgress * 2); // multiplied by 2 for further spread
        const currentY = startY + (p.vy * explodeProgress * 2);
        
        expCtx.fillStyle = p.color;
        expCtx.fillRect(currentX, currentY, particleStep, particleStep);
      }
    } else {
      if (expCtx) expCtx.clearRect(0, 0, explosionCanvas.width, explosionCanvas.height);
      if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0);
      }
    }
    
    // 2. 3D Tilt Logic
    if (isIdle) {
      idleTime += 0.02;
      targetRotY = Math.sin(idleTime) * 15;
      targetRotX = Math.sin(idleTime * 0.5) * 5;
    }
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;
    
    avatarCanvas.style.transform = `perspective(1000px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
  }
  
  animateAvatar();
}
