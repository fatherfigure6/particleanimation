import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';

let scene, camera, renderer, particles = [], nodes = [];
const PARTICLE_COUNT = 200;
const radius = 6;
const verticalSpeed = 0.05;
const clock = new THREE.Clock();

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(10, 12, 35);
  camera.lookAt(0, 10, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const material = new THREE.MeshBasicMaterial({
    color: 0x2c3e50,
    transparent: true,
    opacity: 0.8
  });
  const geometry = new THREE.SphereGeometry(0.1, 8, 8);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.userData = {
      t: i * 0.2,
      yOffset: Math.random() * 2,
      radiusVariation: 0.5 + Math.random() * 0.5
    };
    scene.add(mesh);
    particles.push(mesh);
  }

  const nodeGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xff00aa });

  const node1 = new THREE.Mesh(nodeGeometry, nodeMaterial);
  node1.position.set(4, 10, 0);
  nodes.push({ mesh: node1, strength: 1.5, range: 5 });
  scene.add(node1);

  const node2 = new THREE.Mesh(nodeGeometry, nodeMaterial);
  node2.position.set(-3, 15, 2);
  nodes.push({ mesh: node2, strength: 1.0, range: 4 });
  scene.add(node2);

  const node3 = new THREE.Mesh(nodeGeometry, nodeMaterial);
  node3.position.set(0, 30, -20);
  nodes.push({ mesh: node3, strength: 0, range: 0 });
  scene.add(node3);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  particles.forEach(p => {
    const t = p.userData.t + elapsed;
    const r = radius * p.userData.radiusVariation;
    p.position.set(
      r * Math.cos(t),
      t * verticalSpeed + p.userData.yOffset,
      r * Math.sin(t)
    );

    nodes.forEach(n => {
      if (n.strength === 0) return;
      const dist = p.position.distanceTo(n.mesh.position);
      if (dist < n.range) {
        const direction = p.position.clone().sub(n.mesh.position).normalize();
        const interference = Math.sin(elapsed * 3 + dist * 2) * 0.05 * n.strength;
        p.position.add(direction.multiplyScalar(interference));
      }
    });
  });

  renderer.render(scene, camera);
}
