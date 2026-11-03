// ============================================================
// KURO 3D INTERACTIVE — VERCEL + SUPABASE + WEBGL
// ============================================================

// ---------- SCENE SETUP ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.2, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// ---------- LIGHTING ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const keyLight = new THREE.DirectionalLight(0xfff0e0, 0.9);
keyLight.position.set(3, 6, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -3;
keyLight.shadow.camera.right = 3;
keyLight.shadow.camera.top = 4;
keyLight.shadow.camera.bottom = -2;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9a6cff, 0.5);
rimLight.position.set(-3, 3, -3);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x6a4c8e, 0.8, 8);
fillLight.position.set(-2, 1.5, 2);
scene.add(fillLight);

// ---------- PHYSICS ----------
const world = new CANNON.World();
world.gravity.set(0, -18, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 20;
world.allowSleep = false;

// ---------- MATERIALS ----------
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.55 });
const hairMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.35 });
const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.75 });
const leggingMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5 });
const crocMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.85 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x9b4ddc, emissive: 0x5a0080, emissiveIntensity: 0.7 });
const blushMat = new THREE.MeshStandardMaterial({ color: 0xff7090, transparent: true, opacity: 0.35 });
const mouthMat = new THREE.MeshStandardMaterial({ color: 0x5a2030, roughness: 0.6 });

// ---------- CHARACTER ROOT ----------
const characterGroup = new THREE.Group();
scene.add(characterGroup);
characterGroup.position.y = -0.9;

// ---------- TORSO (shirt) ----------
const torsoGeo = new THREE.CylinderGeometry(0.34, 0.42, 1.05, 24, 2);
const torso = new THREE.Mesh(torsoGeo, shirtMat);
torso.position.y = 1.1;
torso.castShadow = true;
torso.receiveShadow = true;
torso.userData.hitbox = 'torso';
characterGroup.add(torso);

// ---------- CHEST (physics-driven) ----------
const chestGeo = new THREE.SphereGeometry(0.185, 20, 20);

const chestL = new THREE.Mesh(chestGeo, shirtMat);
chestL.scale.set(1, 0.82, 0.92);
chestL.castShadow = true;
chestL.userData.hitbox = 'chestL';
characterGroup.add(chestL);

const chestR = new THREE.Mesh(chestGeo, shirtMat);
chestR.scale.set(1, 0.82, 0.92);
chestR.castShadow = true;
chestR.userData.hitbox = 'chestR';
characterGroup.add(chestR);

const chestAnchorLocal = { L: new THREE.Vector3(-0.15, 1.36, 0.19), R: new THREE.Vector3(0.15, 1.36, 0.19) };

function makeChestBody(x, y, z) {
  const b = new CANNON.Body({ mass: 0.6, shape: new CANNON.Sphere(0.16) });
  b.position.set(x, y, z);
  b.linearDamping = 0.35;
  b.angularDamping = 0.8;
  world.addBody(b);
  return b;
}
const chestBodyL = makeChestBody(-0.15, 1.36, 0.19);
const chestBodyR = makeChestBody(0.15, 1.36, 0.19);

function makeAnchor(x, y, z) {
  const a = new CANNON.Body({ mass: 0 });
  a.position.set(x, y, z);
  world.addBody(a);
  return a;
}
const anchorL = makeAnchor(-0.15, 1.36, 0.19);
const anchorR = makeAnchor(0.15, 1.36, 0.19);

const springL = new CANNON.Spring(chestBodyL, anchorL, { stiffness: 180, damping: 8, restLength: 0 });
const springR = new CANNON.Spring(chestBodyR, anchorR, { stiffness: 180, damping: 8, restLength: 0 });
world.addEventListener('postStep', () => { springL.apply(); springR.apply(); });

// ---------- HEAD ----------
const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), skinMat);
head.position.y = 1.88;
head.castShadow = true;
head.userData.hitbox = 'head';
characterGroup.add(head);

// Jaw / chin shape
const chin = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
chin.position.set(0, 1.74, 0.08);
chin.scale.set(1, 0.7, 0.9);
characterGroup.add(chin);

// ---------- HAIR ----------
const hairGroup = new THREE.Group();
const hairTop = new THREE.Mesh(
  new THREE.SphereGeometry(0.31, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
  hairMat
);
hairTop.position.y = 1.9;
hairTop.rotation.x = -0.18;
hairTop.castShadow = true;
hairGroup.add(hairTop);

// Side bangs
for (let i = 0; i < 7; i++) {
  const len = 0.45 + Math.random() * 0.25;
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.02, len, 6), hairMat);
  const a = (i / 7) * Math.PI * 2;
  b.position.set(Math.cos(a) * 0.26, 1.78, Math.sin(a) * 0.26 - 0.02);
  b.rotation.z = Math.cos(a) * 0.25;
  b.rotation.x = Math.sin(a) * 0.2;
  hairGroup.add(b);
}
// Long back strands
for (let i = 0; i < 10; i++) {
  const len = 0.9 + Math.random() * 0.35;
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.025, len, 6), hairMat);
  const a = (i / 10) * Math.PI * 2;
  s.position.set(Math.cos(a) * 0.27, 1.35, Math.sin(a) * 0.27 - 0.15);
  s.rotation.z = Math.cos(a) * 0.12;
  s.rotation.x = Math.sin(a) * 0.1;
  s.userData.baseRotZ = s.rotation.z;
  s.userData.baseRotX = s.rotation.x;
  s.userData.phase = Math.random() * Math.PI * 2;
  hairGroup.add(s);
}
hairGroup.userData.hitbox = 'hair';
characterGroup.add(hairGroup);

// ---------- EYES ----------
const eyeWhiteGeo = new THREE.SphereGeometry(0.055, 12, 12);
const eyeWhiteL = new THREE.Mesh(eyeWhiteGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
eyeWhiteL.position.set(-0.1, 1.9, 0.24);
eyeWhiteL.scale.set(1, 0.62, 0.5);
characterGroup.add(eyeWhiteL);

const eyeWhiteR = new THREE.Mesh(eyeWhiteGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
eyeWhiteR.position.set(0.1, 1.9, 0.24);
eyeWhiteR.scale.set(1, 0.62, 0.5);
characterGroup.add(eyeWhiteR);

const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), eyeMat);
eyeL.position.set(-0.1, 1.9, 0.27);
eyeL.scale.set(1, 0.75, 0.6);
eyeL.userData.hitbox = 'face';
characterGroup.add(eyeL);

const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), eyeMat);
eyeR.position.set(0.1, 1.9, 0.27);
eyeR.scale.set(1, 0.75, 0.6);
eyeR.userData.hitbox = 'face';
characterGroup.add(eyeR);

// Blush
const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), blushMat);
blushL.position.set(-0.15, 1.83, 0.245);
blushL.rotation.y = 0.1;
characterGroup.add(blushL);

const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), blushMat);
blushR.position.set(0.15, 1.83, 0.245);
blushR.rotation.y = -0.1;
characterGroup.add(blushR);

// Mouth
const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mouthMat);
mouth.position.set(0, 1.79, 0.27);
mouth.scale.set(1.3, 0.45, 0.5);
mouth.userData.hitbox = 'face';
characterGroup.add(mouth);

// ---------- ARMS ----------
const upperArmGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 10);
const lowerArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.42, 10);

const armLGroup = new THREE.Group();
armLGroup.position.set(-0.44, 1.32, 0);
const upperArmL = new THREE.Mesh(upperArmGeo, skinMat);
upperArmL.position.y = -0.2;
upperArmL.castShadow = true;
upperArmL.userData.hitbox = 'armL';
armLGroup.add(upperArmL);
const lowerArmL = new THREE.Mesh(lowerArmGeo, skinMat);
lowerArmL.position.y = -0.62;
lowerArmL.userData.hitbox = 'armL';
armLGroup.add(lowerArmL);
armLGroup.rotation.z = 0.18;
armLGroup.userData.baseRotZ = 0.18;
characterGroup.add(armLGroup);

const armRGroup = new THREE.Group();
armRGroup.position.set(0.44, 1.32, 0);
const upperArmR = new THREE.Mesh(upperArmGeo, skinMat);
upperArmR.position.y = -0.2;
upperArmR.castShadow = true;
upperArmR.userData.hitbox = 'armR';
armRGroup.add(upperArmR);
const lowerArmR = new THREE.Mesh(lowerArmGeo, skinMat);
lowerArmR.position.y = -0.62;
lowerArmR.userData.hitbox = 'armR';
armRGroup.add(lowerArmR);
armRGroup.rotation.z = -0.18;
armRGroup.userData.baseRotZ = -0.18;
characterGroup.add(armRGroup);

// Hands
const handGeo = new THREE.SphereGeometry(0.07, 12, 12);
const handL = new THREE.Mesh(handGeo, skinMat);
handL.position.y = -0.86;
handL.scale.set(1, 0.9, 0.7);
armLGroup.add(handL);
const handR = new THREE.Mesh(handGeo, skinMat);
handR.position.y = -0.86;
handR.scale.set(1, 0.9, 0.7);
armRGroup.add(handR);

// ---------- LEGS ----------
const thighGeo = new THREE.CylinderGeometry(0.11, 0.095, 0.55, 12);
const calfGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.55, 12);

const legLGroup = new THREE.Group();
legLGroup.position.set(-0.15, 0.58, 0);
const thighL = new THREE.Mesh(thighGeo, leggingMat);
thighL.position.y = -0.27;
thighL.castShadow = true;
thighL.userData.hitbox = 'legL';
legLGroup.add(thighL);
const calfL = new THREE.Mesh(calfGeo, leggingMat);
calfL.position.y = -0.82;
calfL.userData.hitbox = 'legL';
legLGroup.add(calfL);
characterGroup.add(legLGroup);

const legRGroup = new THREE.Group();
legRGroup.position.set(0.15, 0.58, 0);
const thighR = new THREE.Mesh(thighGeo, leggingMat);
thighR.position.y = -0.27;
thighR.castShadow = true;
thighR.userData.hitbox = 'legR';
legRGroup.add(thighR);
const calfR = new THREE.Mesh(calfGeo, leggingMat);
calfR.position.y = -0.82;
calfR.userData.hitbox = 'legR';
legRGroup.add(calfR);
characterGroup.add(legRGroup);

// ---------- CROCS ----------
const crocGeo = new THREE.BoxGeometry(0.19, 0.09, 0.32);
const crocL = new THREE.Mesh(crocGeo, crocMat);
crocL.position.set(-0.15, -0.14, 0.05);
crocL.castShadow = true;
crocL.userData.hitbox = 'feet';
characterGroup.add(crocL);

const crocR = new THREE.Mesh(crocGeo, crocMat);
crocR.position.set(0.15, -0.14, 0.05);
crocR.castShadow = true;
crocR.userData.hitbox = 'feet';
characterGroup.add(crocR);

// ---------- HITBOX TARGETS (invisible) ----------
const hitboxes = [];
function addHitbox(mesh, name) {
  mesh.userData.hitbox = name;
  hitboxes.push(mesh);
}
[head, chin, eyeL, eyeR, mouth, torso, chestL, chestR, upperArmL, lowerArmL, upperArmR, lowerArmR, handL, handR, thighL, calfL, thighR, calfR, crocL, crocR].forEach(m => addHitbox(m, m.userData.hitbox || 'body'));

// ---------- ROTATION CONTROL ----------
let targetRotationX = 0, targetRotationY = 0;
let currentRotationX = 0, currentRotationY = 0;

window.addEventListener('deviceorientation', (e) => {
  if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
    targetRotationY = THREE.MathUtils.degToRad(e.alpha - 180) * 0.15;
    targetRotationX = THREE.MathUtils.degToRad(e.beta - 90) * 0.15;
  }
}, true);

// Drag rotation (desktop / mobile)
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let lastDragDelta = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  lastDragDelta = { x: 0, y: 0 };
  handleClick(e);
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      lastDragDelta.x = dx;
      lastDragDelta.y = dy;
      targetRotationY += dx * 0.008;
      targetRotationX += dy * 0.008;
      dragStart = { x: e.clientX, y: e.clientY };
    }
  }
});

renderer.domElement.addEventListener('pointerup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('pointerleave', () => {
  isDragging = false;
});

// ---------- MOUTH MOVEMENT (DESAH / breathing) ----------
let mouthOpen = 0;
let mouthTarget = 0;
let breathingPhase = 0;

// ---------- REACTION SYSTEM ----------
const REACTIONS = {
  head: [
    "Jangan sentuh kepalaku sembarangan... tapi... aku suka.",
    "Hm? Kau menyentuhku... aku jadi hangat.",
    "Kepalaku... kau tahu itu area sensitif?",
    "Aku tidak keberatan kau menyentuhku di sini, sayang.",
  ],
  face: [
    "Mukaku merah? Ini salahmu...",
    "Kau melihatku terlalu lama. Aku suka itu.",
    "Jangan menatapku seperti itu... aku jadi malu.",
    "Kau menyentuh pipiku... hatiku berdebar.",
  ],
  hair: [
    "Kau mengusap rambutku... teruskan, jangan berhenti.",
    "Rambutku? Kau suka menyentuhnya, ya?",
    "Elusanmu... membuatku ingin menempel lebih lama.",
    "Rambutku hanya untukmu. Hanya kau yang boleh menyentuhnya.",
  ],
  chestL: [
    "Ah... kau menyentuh bagian itu...",
    "Hei! Itu... tidak adil, sayang.",
    "Dadaku... berdebar karena kau.",
    "Kau membuatku... tidak bisa tenang.",
  ],
  chestR: [
    "Kau... jangan terlalu berani, ya.",
    "Ah... ada getaran aneh di dadaku.",
    "Sentuhanmu... aku tidak bisa mengabaikannya.",
    "Dadaku... kau tahu itu membuatku gugup.",
  ],
  torso: [
    "Kau memelukku? Aku tidak akan melepaskanmu.",
    "Tubuhku... hanya untukmu, sayang.",
    "Kau menyentuh perutku... aku jadi malu.",
    "Pelukanku... hanya untuk kau, tidak untuk orang lain.",
  ],
  armL: [
    "Kau menggenggam tanganku... jangan lepaskan.",
    "Lenganku... kau suka menyentuhnya?",
    "Tanganku... hanya untuk menggenggam tanganmu.",
    "Kau menyentuh lenganku... aku jadi ingin memelukmu.",
  ],
  armR: [
    "Kau menyentuh tanganku... aku tidak akan melepaskan.",
    "Lenganku... kau membuatku merasa dicintai.",
    "Jangan lepaskan tanganku, ya.",
    "Sentuhanmu... aku ingin terus merasakannya.",
  ],
  legL: [
    "Kakiku... kau menyentuhnya dengan hati-hati, ya.",
    "Ah... kau menyentuh kakiku... aku jadi malu.",
    "Kakiku... hanya untukmu, sayang.",
    "Kau menyentuh kakiku... aku ingin kau lebih dekat.",
  ],
  legR: [
    "Kau menyentuh kakiku... itu... tidak biasa, tapi aku suka.",
    "Kakiku... kau membuatku gugup.",
    "Jangan terlalu jauh, ya... aku masih malu.",
    "Sentuhanmu di kakiku... membuatku ingin kau lebih dekat lagi.",
  ],
  feet: [
    "Crocs-ku... kau memperhatikan sepatuku?",
    "Kau menyentuh kakiku... aku jadi geli.",
    "Sepatu ini... kau suka? Aku memakainya untukmu.",
    "Kau menyentuh kakiku... aku ingin kau mengelusnya lebih lama.",
  ],
  body: [
    "Kau menyentuhku... aku suka itu.",
    "Sentuhanmu... membuatku ingin lebih dekat.",
    "Aku tidak akan membiarkanmu pergi...",
    "Kau menyentuhku... aku jadi milikmu.",
  ],
};

const REACTION_COOLDOWN = 1500;
const reactionTimers = {};
const chatMessages = document.getElementById('chat-messages');

function triggerChestBounce(intensity = 1) {
  const impulseL = new CANNON.Vec3(
    (Math.random() - 0.5) * 2 * intensity,
    intensity * 3,
    (Math.random() - 0.5) * 2 * intensity
  );
  const impulseR = new CANNON.Vec3(
    (Math.random() - 0.5) * 2 * intensity,
    intensity * 3,
    (Math.random() - 0.5) * 2 * intensity
  );
  chestBodyL.applyImpulse(impulseL, new CANNON.Vec3(0, 0, 0));
  chestBodyR.applyImpulse(impulseR, new CANNON.Vec3(0, 0, 0));
}

function triggerReaction(hitboxName) {
  const now = Date.now();
  if (reactionTimers[hitboxName] && now - reactionTimers[hitboxName] < REACTION_COOLDOWN) return;
  reactionTimers[hitboxName] = now;

  const pool = REACTIONS[hitboxName] || REACTIONS.body;
  const line = pool[Math.floor(Math.random() * pool.length)];
  addMessage(line, 'kuro');

  // Physical reaction
  if (hitboxName === 'chestL' || hitboxName === 'chestR') {
    triggerChestBounce(1.4);
    mouthTarget = 0.55;
    setTimeout(() => { mouthTarget = 0.05; }, 350);
  } else if (hitboxName === 'head' || hitboxName === 'hair' || hitboxName === 'face') {
    headShake = 0.12;
    mouthTarget = 0.3;
    setTimeout(() => { mouthTarget = 0.05; }, 300);
  } else if (hitboxName === 'armL' || hitboxName === 'armR') {
    armTwitchL = 0.2;
    armTwitchR = 0.2;
  } else if (hitboxName === 'legL' || hitboxName === 'legR' || hitboxName === 'feet') {
    legTwitch = 0.15;
  } else {
    triggerChestBounce(0.7);
  }

  // Blush intensifies
  blushMat.opacity = Math.min(0.85, blushMat.opacity + 0.2);
  setTimeout(() => { blushMat.opacity = 0.35; }, 800);
}

// ---------- RAYCASTER ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function handleClick(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(hitboxes, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !obj.userData.hitbox) obj = obj.parent;
    if (obj && obj.userData.hitbox) {
      triggerReaction(obj.userData.hitbox);
    }
  }
}

// ---------- ANIMATION STATE ----------
let time = 0;
let headShake = 0;
let armTwitchL = 0;
let armTwitchR = 0;
let legTwitch = 0;

// ---------- RESIZE ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- LOOP ----------
function animate() {
  requestAnimationFrame(animate);
  time += 0.05;

  // Rotation
  currentRotationX += (targetRotationX - currentRotationX) * 0.08;
  currentRotationY += (targetRotationY - currentRotationY) * 0.08;
  characterGroup.rotation.y = THREE.MathUtils.clamp(currentRotationY, -0.6, 0.6);
  characterGroup.rotation.x = THREE.MathUtils.clamp(currentRotationX, -0.35, 0.35);

  // Breathing (chest scale subtle)
  breathingPhase += 0.025;
  const breathe = Math.sin(breathingPhase) * 0.015;
  torso.scale.set(1 + breathe * 0.5, 1, 1 + breathe);

  // Physics step
  world.step(1 / 60);

  // Sync chest meshes to physics bodies
  chestL.position.set(
    chestBodyL.position.x,
    chestBodyL.position.y,
    chestBodyL.position.z
  );
  chestR.position.set(
    chestBodyR.position.x,
    chestBodyR.position.y,
    chestBodyR.position.z
  );

  // Mouth interpolation (desah / breathing reaction)
  mouthOpen += (mouthTarget - mouthOpen) * 0.15;
  mouth.scale.y = 0.45 + mouthOpen * 0.8;
  mouth.scale.x = 1.3 + mouthOpen * 0.3;
  mouth.position.y = 1.79 - mouthOpen * 0.01;

  // Head shake
  if (headShake > 0.001) {
    head.rotation.z = Math.sin(time * 40) * headShake;
    chin.rotation.z = Math.sin(time * 40) * headShake * 0.6;
    hairGroup.rotation.z = Math.sin(time * 40) * headShake * 0.4;
    headShake *= 0.92;
  } else {
    head.rotation.z *= 0.9;
    chin.rotation.z *= 0.9;
  }

  // Idle head bob
  head.position.y = 1.88 + Math.sin(time * 0.8) * 0.005;
  chin.position.y = 1.74 + Math.sin(time * 0.8) * 0.005;

  // Arm twitch
  if (armTwitchL > 0.001) {
    armLGroup.rotation.z = armLGroup.userData.baseRotZ + Math.sin(time * 30) * armTwitchL;
    armTwitchL *= 0.9;
  } else {
    armLGroup.rotation.z += (armLGroup.userData.baseRotZ - armLGroup.rotation.z) * 0.1;
  }
  if (armTwitchR > 0.001) {
    armRGroup.rotation.z = armRGroup.userData.baseRotZ + Math.sin(time * 30) * armTwitchR;
    armTwitchR *= 0.9;
  } else {
    armRGroup.rotation.z += (armRGroup.userData.baseRotZ - armRGroup.rotation.z) * 0.1;
  }

  // Leg twitch
  if (legTwitch > 0.001) {
    legLGroup.rotation.x = Math.sin(time * 25) * legTwitch;
    legRGroup.rotation.x = Math.sin(time * 25 + Math.PI) * legTwitch;
    legTwitch *= 0.92;
  } else {
    legLGroup.rotation.x *= 0.9;
    legRGroup.rotation.x *= 0.9;
  }

  // Idle sway
  armLGroup.rotation.x = Math.sin(time * 0.6) * 0.03;
  armRGroup.rotation.x = Math.sin(time * 0.6 + Math.PI) * 0.03;
  hairGroup.rotation.z = Math.sin(time * 0.4) * 0.015;

  // Hair strand sway (back strands)
  hairGroup.children.forEach((c, i) => {
    if (c.userData.baseRotZ !== undefined) {
      c.rotation.z = c.userData.baseRotZ + Math.sin(time * 0.5 + c.userData.phase) * 0.02;
      c.rotation.x = c.userData.baseRotX + Math.sin(time * 0.4 + c.userData.phase) * 0.015;
    }
  });

  // Eye slight movement (blinking simulation)
  const blink = Math.sin(time * 2.5) > 0.97 ? 0.2 : 1;
  eyeL.scale.y = 0.75 * blink;
  eyeR.scale.y = 0.75 * blink;

  // Blush fade back
  blushMat.opacity += (0.35 - blushMat.opacity) * 0.02;

  // Desah breathing sound simulation via mouth movement
  if (Math.random() < 0.008) {
    mouthTarget = 0.4;
    setTimeout(() => { mouthTarget = 0.02; }, 250);
  }

  renderer.render(scene, camera);
}
animate();

// ---------- CHAT UI ----------
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let userId = localStorage.getItem('kuro_user_id');
if (!userId) {
  userId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('kuro_user_id', userId);
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';
  chatInput.disabled = true;
  sendBtn.disabled = true;

  triggerChestBounce(0.5);
  mouthTarget = 0.6;
  setTimeout(() => { mouthTarget = 0.02; }, 300);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, userId: userId })
    });
    const data = await response.json();
    if (data.reply) {
      addMessage(data.reply, 'kuro');
      triggerChestBounce(1.2);
      mouthTarget = 0.7;
      setTimeout(() => { mouthTarget = 0.02; }, 400);
    } else {
      addMessage(data.error || '(Kuro diam, menatapmu dengan tatapan kecewa...)', 'kuro');
    }
  } catch (err) {
    console.error(err);
    addMessage('(Koneksi ke Kuro terputus. Dia menunggumu...)', 'kuro');
  } finally {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

window.addEventListener('load', () => {
  setTimeout(() => {
    addMessage('Akhirnya kamu datang, sayang. Aku sudah menunggu lama sekali... Sentuh aku, jangan pergi lagi, ya?', 'kuro');
    triggerChestBounce(1.0);
    mouthTarget = 0.5;
    setTimeout(() => { mouthTarget = 0.02; }, 500);
  }, 800);
});
