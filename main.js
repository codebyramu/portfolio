import * as THREE from 'three';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

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
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
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

      vec2 mouse = uMouse;
      mouse.x *= uResolution.x / uResolution.y;
      
      float dist = distance(st, mouse);
      float mouseEffect = smoothstep(0.3, 0.0, dist);

      vec2 pos = st * 3.0;
      float n = snoise(pos + uTime * 0.2 + mouseEffect * 2.0);
      
      vec3 colorBase = vec3(0.04, 0.04, 0.04);
      vec3 colorGold = vec3(0.78, 0.65, 0.29); 
      
      vec3 finalColor = mix(colorBase, colorBase * 1.5, n);
      finalColor += colorGold * mouseEffect * 0.15;
      finalColor += vec3(n * 0.05);

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
  
  function animate() {
    requestAnimationFrame(animate);
    if (window.innerWidth > 768) {
      currentMouse.lerp(targetMouse, 0.1);
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uMouse.value.copy(currentMouse);
      renderer.render(scene, camera);
    }
  }
  animate();
}

// ==========================================
// Custom Cursor & Spotlight
// ==========================================
const cursor = document.querySelector('.custom-cursor');
const interactiveElements = document.querySelectorAll('a, button, .interactive-card');
const stereoCards = document.querySelectorAll('.stereo-card');

let clientX = -100;
let clientY = -100;

window.addEventListener('mousemove', (e) => {
  clientX = e.clientX;
  clientY = e.clientY;
  if (cursor) {
    cursor.style.left = clientX + 'px';
    cursor.style.top = clientY + 'px';
  }
  if (window.innerWidth > 768) {
    stereoCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }
});

interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
});

// ==========================================
// 3D Tilt Magnet Effect
// ==========================================
const tiltCards = document.querySelectorAll('.tilt-card');
tiltCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 768) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  });
});

// ==========================================
// Modal Logic (Interactive Cards)
// ==========================================
const interactiveCards = document.querySelectorAll('.interactive-card');
const modals = document.querySelectorAll('.modal-overlay');
const closeBtns = document.querySelectorAll('.modal-close');

interactiveCards.forEach(card => {
  card.addEventListener('click', (e) => {
    const target = document.getElementById(card.getAttribute('data-modal'));
    if (target) {
      target.classList.add('active');
    }
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

// ==========================================
// Entry Overlay
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('entry-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log(err));
      }
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.visibility = 'hidden', 1000);
    });
  }
});

// ==========================================
// 3D Outward-Facing Museum
// ==========================================
const threeCarouselSection = document.getElementById('three-carousel');
if (threeCarouselSection) {
  const canvas = document.getElementById('carousel-canvas');
  const overlaysContainer = document.getElementById('carousel-html-overlays');

  // Scene setup
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
  // Camera is positioned FAR in front of the circle, looking at it from outside
  camera.position.set(0, 0, 2000); 
  camera.lookAt(0, 0, 0);

  const carouselGroup = new THREE.Group();
  scene.add(carouselGroup);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); 

  // Particles
  const particlesGeo = new THREE.BufferGeometry();
  const particlesCount = 200;
  const posArray = new Float32Array(particlesCount * 3);
  for(let i = 0; i < particlesCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 3000;
    posArray[i+1] = (Math.random() - 0.5) * 2000;
    posArray[i+2] = (Math.random() - 0.5) * 3000;
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particlesMat = new THREE.PointsMaterial({
    size: 4,
    color: 0xd4a373,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particlesMesh);

  // Load Textures
  const textureLoader = new THREE.TextureLoader();
  const cardData = [
    { img: '/running_100.jpg', video: '/running_100.mp4', title: '100M SPRINT', subtitle: 'I am a sprinter', desc: 'The explosive power of the 100m dash, captured in slow motion.' },
    { img: '/running_200.jpg', video: '/running_200.mp4', title: '200M RACE', subtitle: 'Pushing the bend', desc: 'Navigating the curve with precision and speed in the 200m sprint.' },
    { img: '/running_800.jpg', video: '/running_800.mp4', title: '800M RUN', subtitle: 'Pure endurance', desc: 'Pushing through exhaustion in the grueling 800m race.' },
    { img: '/longjump.jpg', video: '/longjump.mp4', title: 'LONG JUMP', subtitle: 'Explosive power', desc: 'Defying gravity. A cinematic capture of the long jump landing.' },
    { img: '/violin.jpg', video: '/violin.mp4', title: 'CARNATIC VIOLIN', subtitle: 'Currently learning', desc: 'Finding rhythm and emotion through Carnatic violin performances.' }
  ];

  const cards = [];
  const outlines = [];
  const htmlTexts = [];
  
  // Card Geometry
  const cW = 600;
  const cH = 400;
  const geometry = new THREE.PlaneGeometry(cW, cH);
  const edgesGeo = new THREE.EdgesGeometry(geometry);
  
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const radius = 1000;
  const angleStep = (Math.PI * 2) / 5; // 72 degrees

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float uActive;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      // Chromatic aberration
      vec2 shift = vec2(0.004, 0.0);
      float r = texture2D(tDiffuse, vUv + shift).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - shift).b;
      
      vec3 color = vec3(r, g, b);
      
      // Film grain
      float grain = random(vUv * time) * 0.12;
      color -= grain;
      
      gl_FragColor = vec4(color * uActive, 1.0);
    }
  `;

  cardData.forEach((data, i) => {
    const texture = textureLoader.load(data.img);
    
    const uniforms = {
      tDiffuse: { value: texture },
      time: { value: 0 },
      uActive: { value: i === 0 ? 1.0 : 0.4 }
    };
    
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Gold glowing border
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xd4a373, transparent: true, opacity: 1 });
    const outline = new THREE.LineSegments(edgesGeo, edgesMat);
    mesh.add(outline);
    outlines.push(outline);
    
    // Position on circle around origin, facing outward
    const angle = i * angleStep;
    mesh.position.x = Math.sin(angle) * radius;
    mesh.position.y = 0;
    mesh.position.z = Math.cos(angle) * radius;
    
    // Face outward matching the circle angle
    mesh.rotation.y = angle;
    
    mesh.userData = { ...data, index: i, uniforms };
    carouselGroup.add(mesh);
    cards.push(mesh);

    // Create HTML overlay
    const div = document.createElement('div');
    div.className = 'carousel-card-text'; 
    div.style.position = 'absolute';
    div.style.pointerEvents = 'none';
    div.style.textAlign = 'left';
    div.innerHTML = `<h3 class="static-serif" style="font-size: clamp(2rem, 4vw, 3rem); margin: 0; line-height: 1;">${data.title}</h3>
                     <p style="font-family: 'Space Mono', monospace; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; font-size: 1rem;">${data.subtitle}</p>`;
    div.style.display = 'none'; 
    overlaysContainer.appendChild(div);
    htmlTexts.push(div);
  });

  let activeIndex = 0;

  gsap.to(carouselGroup.rotation, {
    y: -4 * angleStep, // Rotate group to bring subsequent cards to front
    ease: "none",
    scrollTrigger: {
      trigger: threeCarouselSection,
      start: 'top top',
      end: '+=4000px', // Plenty of space to scroll
      scrub: 1.5, // Cinematic heavy smoothing
      snap: 1 / 4,
      pin: true,
      onUpdate: (self) => {
        activeIndex = Math.round(self.progress * 4);
      }
    }
  });

  function render() {
    requestAnimationFrame(render);
    const time = Date.now() * 0.001;
    
    // Animate particles
    particlesMesh.rotation.y = time * 0.03;
    particlesMesh.rotation.x = time * 0.01;

    cards.forEach((card, i) => {
      // Update shader time for grain
      card.userData.uniforms.time.value = time;
      
      // Pulse gold border on active card & Dimming
      if (i === activeIndex) {
        outlines[i].material.opacity = 0.6 + Math.sin(time * 3) * 0.4;
        card.userData.uniforms.uActive.value += (1.0 - card.userData.uniforms.uActive.value) * 0.05;
      } else {
        outlines[i].material.opacity = 0; // Not visible/pulsing
        card.userData.uniforms.uActive.value += (0.4 - card.userData.uniforms.uActive.value) * 0.05;
      }

      // Handle HTML Titles
      const textEl = htmlTexts[i];
      if (i === activeIndex) {
        textEl.style.display = 'block';
        
        // Project bottom-left corner of the card
        // Corner is (-cW/2, -cH/2, 0) in local space
        const localPos = new THREE.Vector3(-cW/2, -cH/2 - 20, 0);
        localPos.applyMatrix4(card.matrixWorld);
        localPos.project(camera);
        
        // Only show if it's actually in front of the camera
        if (localPos.z < 1) {
          const x = (localPos.x * .5 + .5) * window.innerWidth;
          const y = (localPos.y * -.5 + .5) * window.innerHeight;
          
          textEl.style.left = `${x}px`;
          textEl.style.top = `${y}px`;
          textEl.style.transform = `translate(0, 0)`; // Align left to bottom-left corner
        }
      } else {
        textEl.style.display = 'none';
      }
    });
    
    renderer.render(scene, camera);
  }
  
  render();
  
  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Click Lightbox
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxVideo = document.getElementById('lightbox-video');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxSubtitle = document.getElementById('lightbox-subtitle');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.querySelector('.lightbox-close');

  canvas.addEventListener('click', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(cards);
    if (intersects.length > 0) {
      // Pick the closest intersected object
      intersects.sort((a, b) => a.distance - b.distance);
      const card = intersects[0].object;
      const data = card.userData;
      
      // Only open if clicking the active card
      if (data.index === activeIndex) {
        lightboxTitle.innerText = data.title;
        lightboxSubtitle.innerText = data.subtitle; 
        lightboxDesc.innerText = data.desc;
        
        if (lightboxVideo) {
          lightboxVideo.src = data.video;
          lightboxVideo.load();
        }
        
        lightbox.classList.add('active');
      }
    }
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
      if (lightboxVideo) lightboxVideo.pause();
    });
  }
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-layout')) {
      lightbox.classList.remove('active');
      if (lightboxVideo) lightboxVideo.pause();
    }
  });
}
