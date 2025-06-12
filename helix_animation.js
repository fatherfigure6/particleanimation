import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';

let scene, camera, renderer, particles = [], velocities = [], nodes = [];
const PARTICLE_COUNT = 200;
const clock = new THREE.Clock();

const params = {
  separationDistance: 1.2,
  alignmentDistance: 2.5,
  cohesionDistance: 3.5,
  maxForce: 0.03,
  maxSpeed: 0.08,
  upwardBias: new THREE.Vector3(0, 0.005, 0)
};

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
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 10,
      (Math.random() - 0.5) * 20
    );
    scene.add(mesh);
    particles.push(mesh);
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      0.02 + Math.random() * 0.05,
      (Math.random() - 0.5) * 0.1
    ));
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

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = particles[i];
    let v = velocities[i];

    let separation = new THREE.Vector3();
    let alignment = new THREE.Vector3();
    let cohesion = new THREE.Vector3();
    let countSeparation = 0, countAlignment = 0, countCohesion = 0;

    for (let j = 0; j < PARTICLE_COUNT; j++) {
      if (i === j) continue;
      let neighbor = particles[j];
      let d = p.position.distanceTo(neighbor.position);

      if (d < params.separationDistance) {
        let diff = p.position.clone().sub(neighbor.position).normalize().divideScalar(d);
        separation.add(diff);
        countSeparation++;
      }
      if (d < params.alignmentDistance) {
        alignment.add(velocities[j]);
        countAlignment++;
      }
      if (d < params.cohesionDistance) {
        cohesion.add(neighbor.position);
        countCohesion++;
      }
    }

    if (countSeparation > 0) separation.divideScalar(countSeparation);
    if (countAlignment > 0) alignment.divideScalar(countAlignment).sub(v).clampLength(0, params.maxForce);
    if (countCohesion > 0) {
      cohesion.divideScalar(countCohesion).sub(p.position).clampLength(0, params.maxForce);
    }

    v.add(separation.multiplyScalar(1.5));
    v.add(alignment.multiplyScalar(1.0));
    v.add(cohesion.multiplyScalar(1.0));
    v.add(params.upwardBias);

    // Energy node disturbance
    nodes.forEach(n => {
      if (n.strength === 0) return;
      const dist = p.position.distanceTo(n.mesh.position);
      if (dist < n.range) {
        const direction = p.position.clone().sub(n.mesh.position).normalize();
        const force = Math.sin(elapsed * 2 + dist * 3) * 0.02 * n.strength;
        v.add(direction.multiplyScalar(force));
      }
    });

    v.clampLength(0, params.maxSpeed);
    p.position.add(v);
  }

  renderer.render(scene, camera);
}
