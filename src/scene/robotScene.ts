import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Snapshot } from '../domain/simulatedRobot';
import { legIk, toWorld } from './kinematics';
import { PORTS, statusLabel, type ServoAngle } from './status';

export type { ServoAngle } from './status';

/** Couleurs de la charte (section 07, scène 3D). */
const C = {
  grid: [0xd5d2c8, 0xf3efe5],
  gridOp: 0.9,
  ring: 0x20477d,
  pts: 0xd5d2c8,
  tickMin: 0x14130f,
  tickMaj: 0xe1a720,
  wire: 0x14130f,
  /** Arêtes du rendu plein, comme la maquette en rendu plein. */
  edgeOpacity: 0.35,
  lead: '#14130F',
  body: 0xfaf7f0,
  servo: 0x20477d,
  dark: 0x5f5b50,
  acc: 0xe1a720,
  rim: 0xe1a720,
};

export type RobotScene = {
  setState: (s: Snapshot) => void;
  /** Mode câblage : met en avant une patte (1 à 4) et ses étiquettes de ports, ou aucune. */
  highlight: (leg: number | null) => void;
  /** Tourne la caméra : azimut et élévation, en radians. */
  rotate: (deltaAz: number, deltaEl?: number) => void;
  dispose: () => void;
};

type Leg = {
  yaw: THREE.Object3D;
  fem: THREE.Object3D;
  tib: THREE.Object3D;
  foot: THREE.Object3D;
  a0: number;
  b0: number;
  l1: number;
  l2: number;
  cx: number;
  /** Numéro de la patte, comme dans l'assistant de calibration : 1 avant droite, 2 avant gauche, 3 arrière gauche, 4 arrière droite. */
  label: number;
  /** Composante vers l'avant du vecteur du centre vers la hanche : positive pour les pattes avant. */
  front: 1 | -1;
  /** Composante z du vecteur unitaire du centre vers la hanche, repère du robot (x avant, z vers la droite). */
  uz: number;
  /** Les pattes d'une même diagonale lèvent le pied en même temps. */
  phaseOffset: number;
  yawNow: number;
  aNow: number;
  bNow: number;
};

/**
 * Charge le modèle. Un fichier `.json` de la forme `{ "glb": "<base64>" }` est accepté pour les
 * hébergements qui ne servent pas les fichiers `.glb` (aperçu de développement).
 */
async function loadModel(url: string) {
  const loader = new GLTFLoader();
  if (!url.endsWith('.json')) return loader.loadAsync(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Modèle introuvable : ${res.status}`);
  const { glb } = (await res.json()) as { glb: string };
  const bytes = Uint8Array.from(atob(glb), (c) => c.charCodeAt(0));
  return loader.parseAsync(bytes.buffer, '');
}

const SCALE = 0.0085;
/** Hauteur du corps et portée au sol pour les deux postures (unités de la scène). */
const POSES = { sitting: { h: 0.16, r: 0.68 }, standing: { h: 0.42, r: 0.86 } };
const GROUND_OFFSET = 0.08;

/**
 * Monte la scène 3D dans le canevas. `modelUrl` est un fichier glTF binaire dont les noeuds
 * `leg<k>_hip|fem|tib|yaw` portent les mesures du rig. Renvoie une promesse qui échoue si le
 * modèle est introuvable ou illisible : l'appelant garde alors la vue du dessus.
 */
export async function createRobotScene(
  canvas: HTMLCanvasElement,
  modelUrl: string,
  reducedMotion: boolean,
  onServos: (angles: ServoAngle[]) => void,
  opts: { wiring?: boolean } = {},
): Promise<RobotScene> {
  const gltf = await loadModel(modelUrl);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1.6, 0.1, 100);
  // Vue de trois quarts avant, comme la maquette.
  // En mode câblage, la caméra est derrière le robot et haute : l'avant est en haut de l'image.
  let az = opts.wiring ? -Math.PI / 2 : Math.PI / 2 + 0.05;
  /** Élévation bornée comme la maquette : de 0,15 à 1,2 rad. */
  const EL_MIN = 0.15;
  const EL_MAX = 1.2;
  const clampEl = (v: number) => Math.max(EL_MIN, Math.min(EL_MAX, v));
  let el = opts.wiring ? 1.0 : 0.5;
  const dist = opts.wiring ? 5.7 : 4.9;
  const placeCamera = () => {
    camera.position.set(
      Math.sin(az) * Math.cos(el) * dist,
      Math.sin(el) * dist,
      Math.cos(az) * Math.cos(el) * dist,
    );
    // La caméra vise le robot : elle le suit quand il marche.
    camera.position.x += robot.position.x;
    camera.position.z += robot.position.z;
    camera.lookAt(robot.position.x, 0.3, robot.position.z);
  };

  // Intensités de la maquette (three.js r128) multipliées par π : unités physiques depuis r155.
  scene.add(new THREE.AmbientLight(0xffffff, 0.75 * Math.PI));
  const key = new THREE.DirectionalLight(0xffffff, 1 * Math.PI);
  key.position.set(3, 6, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.rim, 0.25 * Math.PI);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const grid = new THREE.GridHelper(12, 24, C.grid[0], C.grid[1]);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = C.gridOp;
  scene.add(grid);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 1.765, 128),
    new THREE.MeshBasicMaterial({ color: C.ring, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);
  const pts: number[] = [];
  for (let i = -12; i <= 12; i++)
    for (let j = -12; j <= 12; j++) pts.push(i * 0.25, 0.001, j * 0.25);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: C.pts, size: 0.018 })));
  // Graduations du cadran : une toutes les 10°, majeures tous les 90°, qui tournent lentement.
  const ticks = new THREE.Group();
  for (let k = 0; k < 36; k++) {
    const t = new THREE.Mesh(
      new THREE.PlaneGeometry(0.012, k % 9 ? 0.06 : 0.14),
      new THREE.MeshBasicMaterial({ color: k % 9 ? C.tickMin : C.tickMaj, side: THREE.DoubleSide }),
    );
    const a = (k / 36) * Math.PI * 2;
    t.position.set(Math.cos(a) * 1.9, 0.003, Math.sin(a) * 1.9);
    t.rotation.x = -Math.PI / 2;
    t.rotation.z = -a + Math.PI / 2;
    ticks.add(t);
  }
  scene.add(ticks);
  // Le cadran de cap n'a pas de sens pour le câblage : il encombrerait les étiquettes.
  ring.visible = ticks.visible = !opts.wiring;

  const mat = (color: number, metalness: number, roughness: number) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const matBody = mat(C.body, 0.45, 0.45);
  const matServo = mat(C.servo, 0.25, 0.5);
  const matDark = mat(C.dark, 0.4, 0.6);
  const matAcc = mat(C.acc, 0.3, 0.45);
  const edgeMat = new THREE.LineBasicMaterial({
    color: C.wire,
    transparent: true,
    opacity: C.edgeOpacity,
  });
  const byKind: Record<string, THREE.Material> = {
    alu: matBody,
    horn: matBody,
    servo: matServo,
    us: matAcc,
    cam: matAcc,
    pcb: matDark,
    hat: matDark,
    batt: matDark,
    nylon: matDark,
  };

  const robot = new THREE.Group();
  scene.add(robot);
  const body = new THREE.Group();
  robot.add(body);
  const model = gltf.scene;
  model.scale.setScalar(SCALE);
  body.add(model);
  const nodes: Record<string, THREE.Object3D> = {};
  let ultrasonic: THREE.Object3D | null = null;
  model.traverse((o) => {
    nodes[o.name] = o;
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh;
      const kind = (m.name.split('_')[1] ?? 'alu').replace(/\.\d+$/, '');
      m.material = byKind[kind] ?? matBody;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 35), edgeMat));
      if (kind === 'us') ultrasonic = m;
    }
  });

  // Repère du robot : l'avant est le côté du capteur à ultrasons. Le modèle est tourné autour de
  // l'axe vertical pour que cet avant soit l'axe +x de la scène, puis recentré sur ses quatre hanches.
  const hips = [1, 2, 3, 4].map((k) => nodes[`leg${k}_hip`]);
  if (hips.some((h) => !h) || !ultrasonic) {
    renderer.dispose();
    throw new Error('Rig du modèle incomplet : quatre pattes et capteur à ultrasons attendus');
  }
  model.updateMatrixWorld(true);
  const centroid = new THREE.Vector3();
  hips.forEach((h) => centroid.add(h.getWorldPosition(new THREE.Vector3())));
  centroid.divideScalar(4);
  const us = new THREE.Box3()
    .setFromObject(ultrasonic as THREE.Object3D)
    .getCenter(new THREE.Vector3());
  model.rotation.y = Math.atan2(us.z - centroid.z, us.x - centroid.x);
  model.updateMatrixWorld(true);
  const center = new THREE.Vector3();
  hips.forEach((h) => center.add(h.getWorldPosition(new THREE.Vector3())));
  center.divideScalar(4);
  const hipHeight = hips[0].userData.hF as number;
  model.position.set(-center.x, 0.12 - hipHeight * SCALE, -center.z);
  model.updateMatrixWorld(true);

  const legs: Leg[] = [];
  const labelEls: HTMLElement[] = [];
  hips.forEach((hip, i) => {
    const k = i + 1;
    const fem = nodes[`leg${k}_fem`];
    const tib = nodes[`leg${k}_tib`];
    const a0 = fem.userData.a0 as number;
    const b0 = tib.userData.b0 as number;
    const l2 = tib.userData.L2 as number;
    const foot = new THREE.Object3D();
    foot.position.set(l2 * Math.cos(a0 + b0), l2 * Math.sin(a0 + b0), 0);
    tib.add(foot);
    // Position de la hanche dans le repère du robot (x avant, z vers la droite quand on regarde vers +x).
    const p = hip.getWorldPosition(new THREE.Vector3());
    const rx = p.x;
    const rz = p.z;
    const len = Math.hypot(rx, rz);
    const front = rx > 0 ? 1 : -1;
    const left = rz < 0;
    const label = front === 1 ? (left ? 2 : 1) : left ? 3 : 4;
    legs.push({
      yaw: nodes[`leg${k}_yaw`],
      fem,
      tib,
      foot,
      a0,
      b0,
      l1: (fem.userData.L1 as number) * SCALE,
      l2: l2 * SCALE,
      cx: (hip.userData.CX as number) * SCALE,
      label,
      front,
      uz: rz / len,
      phaseOffset: label === 2 || label === 4 ? 0 : Math.PI,
      yawNow: 0,
      aNow: 0,
      bNow: 0,
    });
  });
  const stage = canvas.parentElement;
  const ns = 'http://www.w3.org/2000/svg';
  const overlay = document.createElement('div');
  overlay.className = 'ov';
  overlay.setAttribute('aria-hidden', 'true');
  const leader = document.createElementNS(ns, 'svg');
  leader.setAttribute('class', 'ovsvg');
  const leaderPath = document.createElementNS(ns, 'path');
  leaderPath.setAttribute('fill', 'none');
  leaderPath.setAttribute('stroke', C.lead);
  leaderPath.setAttribute('stroke-width', '1');
  const leaderDot = document.createElementNS(ns, 'circle');
  leaderDot.setAttribute('r', '3');
  leaderDot.setAttribute('fill', C.lead);
  leader.append(leaderPath, leaderDot);
  const fleet = document.createElement('div');
  fleet.className = 'fleet';
  if (!opts.wiring) overlay.append(leader, fleet);
  stage?.appendChild(overlay);
  legs.forEach((leg) => {
    if (opts.wiring) return;
    const d = document.createElement('div');
    d.className = 'legtag';
    d.setAttribute('aria-hidden', 'true');
    d.textContent = `P${leg.label}`;
    overlay.appendChild(d);
    labelEls.push(d);
  });

  // Mode câblage : étiquettes de ports par patte, repères d'articulation, module à ultrasons.
  const LEG_NAMES = ['avant droite', 'avant gauche', 'arrière gauche', 'arrière droite'];
  const JOINT_NAMES = ['hanche', 'cuisse', 'pied'];
  const matHi = mat(C.acc, 0.2, 0.5);
  const legMeshes = legs.map((leg) => {
    const arr: THREE.Mesh[] = [];
    leg.yaw.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) arr.push(o as THREE.Mesh);
    });
    return arr;
  });
  const origMat = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const wtags: HTMLElement[] = [];
  const wdots: HTMLElement[][] = [];
  let usTag: HTMLElement | null = null;
  let hatTag: HTMLElement | null = null;
  if (opts.wiring) {
    const mk = (cls: string, text: string) => {
      const d = document.createElement('div');
      d.className = cls;
      d.textContent = text;
      overlay.appendChild(d);
      return d;
    };
    legs.forEach((leg) => {
      const [p0, p1, p2] = PORTS[leg.label];
      const t = mk('wtag', '');
      const title = document.createElement('b');
      title.textContent = `Patte ${leg.label}`;
      const where = document.createElement('i');
      where.textContent = LEG_NAMES[leg.label - 1];
      t.append(title, where);
      [p0, p1, p2].forEach((port, j) => {
        const row = document.createElement('span');
        row.textContent = `${j + 1} · P${port} ${JOINT_NAMES[j]}`;
        t.appendChild(row);
      });
      wtags.push(t);
      wdots.push([1, 2, 3].map((n) => mk('wdot', String(n))));
    });
    usTag = mk('wtag wtag-sm', 'Ultrasons : GND · 3V3 · D2 · D3');
    hatTag = mk('wtag wtag-sm', 'Robot HAT');
  }

  // État animé
  let target: Snapshot | null = null;
  let h = POSES.sitting.h;
  let r = POSES.sitting.r;
  let phase = 0;
  let wavePhase = 0;
  let frame = 0;
  const clock = { last: performance.now() };

  const animate = (dt: number) => {
    if (!target) return;
    const wantStand =
      target.posture === 'moving' ? target.motion?.kind !== 'sit' : target.posture === 'standing';
    const goal = wantStand ? POSES.standing : POSES.sitting;
    const k = reducedMotion ? 1 : Math.min(1, dt * 5);
    h += (goal.h - h) * k;
    r += (goal.r - r) * k;
    const w = toWorld(target.xCm, target.yCm, target.headingDeg);
    const f = reducedMotion ? 1 : Math.min(1, dt * 6);
    robot.position.x += (w.x - robot.position.x) * f;
    robot.position.z += (w.z - robot.position.z) * f;
    // Chemin angulaire le plus court pour éviter un tour complet au passage de 360° à 0°.
    const dRot = Math.atan2(
      Math.sin(w.rotY - robot.rotation.y),
      Math.cos(w.rotY - robot.rotation.y),
    );
    robot.rotation.y += dRot * f;
    // L'anneau et ses graduations entourent le robot et le suivent ; la grille reste fixe.
    ring.position.x = ticks.position.x = robot.position.x;
    ring.position.z = ticks.position.z = robot.position.z;

    const m = target.motion;
    const waving = !!m && m.kind === 'wave' && !reducedMotion;
    if (waving) wavePhase += dt;
    else wavePhase = 0;
    const walking = !reducedMotion && !!m && (m.kind === 'walk' || m.kind === 'turn');
    if (walking) phase += dt * 8;
    legs.forEach((leg) => {
      const s = walking ? Math.sin(phase + leg.phaseOffset) : 0;
      const lift = walking ? Math.max(0, Math.cos(phase + leg.phaseOffset)) * 0.12 : 0;
      let yaw = 0;
      if (walking && m) {
        // Pied levé : il avance dans le sens de la marche ou de la rotation.
        yaw = m.kind === 'walk' ? s * 0.28 * m.sign * Math.sign(leg.uz) : s * 0.28 * m.sign;
      }
      let rr = r - leg.cx;
      let hh = -(h + GROUND_OFFSET) + lift;
      if (waving && leg.label === 1) {
        // Salut de la patte avant droite, comme la maquette.
        yaw = Math.sin(wavePhase * 10) * 0.25;
        hh = 0.25;
        rr = 0.45;
      }
      const [a, b] = legIk(rr, hh, leg.l1, leg.l2);
      leg.yawNow = yaw;
      leg.aNow = a;
      leg.bNow = b;
      leg.yaw.rotation.y = yaw;
      leg.fem.rotation.z = a - leg.a0;
      leg.tib.rotation.z = b - leg.b0;
    });
    body.position.y = h - 0.04;
  };

  const v = new THREE.Vector3();
  const top = new THREE.Vector3();
  const placeWiring = () => {
    const w = canvas.clientWidth;
    const hh = canvas.clientHeight;
    body.updateWorldMatrix(true, false);
    const screen = (o: THREE.Vector3) => {
      o.project(camera);
      return { x: ((o.x + 1) / 2) * w, y: ((1 - o.y) / 2) * hh };
    };
    const c = screen(new THREE.Vector3(0, 0.2, 0).applyMatrix4(body.matrixWorld));
    legs.forEach((leg, i) => {
      [leg.yaw, leg.fem, leg.tib].forEach((n, j) => {
        n.updateWorldMatrix(true, false);
        const p = screen(v.clone().setFromMatrixPosition(n.matrixWorld));
        wdots[i][j].style.left = `${p.x}px`;
        wdots[i][j].style.top = `${p.y}px`;
      });
      leg.foot.updateWorldMatrix(true, false);
      const f = screen(v.clone().setFromMatrixPosition(leg.foot.matrixWorld));
      const dx = f.x - c.x;
      const dy = f.y - c.y;
      const n = Math.hypot(dx, dy) || 1;
      // L'étiquette part du pied vers l'extérieur et reste entièrement dans la vue.
      const tw = wtags[i].offsetWidth;
      const th = wtags[i].offsetHeight;
      const x0 = f.x + (dx / n) * 26 - (dx >= 0 ? 0 : tw);
      const y0 = f.y + (dy / n) * 26 - (dy >= 0 ? 0 : th);
      wtags[i].style.left = `${Math.max(4, Math.min(w - tw - 4, x0))}px`;
      wtags[i].style.top = `${Math.max(4, Math.min(hh - th - 4, y0))}px`;
    });
    if (usTag) {
      const u = screen(
        new THREE.Box3()
          .setFromObject(ultrasonic as unknown as THREE.Object3D)
          .getCenter(new THREE.Vector3()),
      );
      usTag.style.left = `${u.x}px`;
      usTag.style.top = `${u.y - 34}px`;
    }
    if (hatTag) {
      hatTag.style.left = `${c.x}px`;
      hatTag.style.top = `${c.y}px`;
    }
  };

  const placeLabels = () => {
    if (opts.wiring) {
      placeWiring();
      return;
    }
    const w = canvas.clientWidth;
    const hh = canvas.clientHeight;
    body.updateWorldMatrix(true, false);
    top.set(0, 0.45, 0).applyMatrix4(body.matrixWorld).project(camera);
    const tx = ((top.x + 1) / 2) * w;
    const ty = ((1 - top.y) / 2) * hh;
    const fx = Math.min(w - 200, tx + 90);
    const fy = Math.max(80, ty - 70);
    leader.setAttribute('viewBox', `0 0 ${w} ${hh}`);
    leaderPath.setAttribute(
      'd',
      `M${tx.toFixed(1)} ${ty.toFixed(1)}L${fx - 6} ${fy - 4}H${fx + 160}`,
    );
    leaderDot.setAttribute('cx', tx.toFixed(1));
    leaderDot.setAttribute('cy', ty.toFixed(1));
    fleet.style.left = `${fx}px`;
    fleet.style.top = `${fy}px`;
    const text = target
      ? `PiCrawler-01 · sim\nStatut : ${statusLabel(target)}\nSite : simulateur local`
      : '';
    if (fleet.textContent !== text) fleet.textContent = text;
    legs.forEach((leg, i) => {
      leg.foot.updateWorldMatrix(true, false);
      v.setFromMatrixPosition(leg.foot.matrixWorld).add(new THREE.Vector3(0, 0.22, 0));
      v.project(camera);
      labelEls[i].style.left = `${((v.x + 1) / 2) * w}px`;
      labelEls[i].style.top = `${((1 - v.y) / 2) * hh}px`;
    });
  };

  let raf = 0;
  const resize = () => {
    const w = canvas.clientWidth;
    const hh = canvas.clientHeight;
    if (!w || !hh) return;
    renderer.setSize(w, hh, false);
    camera.aspect = w / hh;
    camera.updateProjectionMatrix();
  };
  const loop = (t: number) => {
    const dt = Math.min(0.05, (t - clock.last) / 1000);
    clock.last = t;
    animate(dt);
    if (!reducedMotion) ticks.rotation.y -= (dt * 2 * Math.PI) / 600;
    if (frame++ % 6 === 0) {
      const deg = (x: number) => Math.round((x * 180) / Math.PI);
      const angles: ServoAngle[] = [];
      legs.forEach((leg) => {
        const [p0, p1, p2] = PORTS[leg.label];
        angles.push({ port: p0, leg: leg.label, deg: deg(leg.yawNow) });
        angles.push({ port: p1, leg: leg.label, deg: deg(leg.aNow) });
        angles.push({ port: p2, leg: leg.label, deg: deg(leg.bNow) + 90 });
      });
      onServos(angles.sort((x, y) => x.port - y.port));
    }
    placeCamera();
    camera.updateMatrixWorld(true);
    renderer.render(scene, camera);
    placeLabels();
    raf = requestAnimationFrame(loop);
  };

  let drag: [number, number, number, number] | null = null;
  const down = (e: PointerEvent) => {
    drag = [e.clientX, e.clientY, az, el];
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    az = drag[2] - (e.clientX - drag[0]) * 0.008;
    el = clampEl(drag[3] + (e.clientY - drag[1]) * 0.006);
  };
  const up = () => {
    drag = null;
    canvas.style.cursor = '';
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  window.addEventListener('resize', resize);

  resize();
  placeCamera();
  raf = requestAnimationFrame(loop);

  return {
    setState: (s) => {
      target = s;
    },
    highlight: (k) => {
      if (!opts.wiring) return;
      legs.forEach((leg, i) => {
        const on = k === leg.label;
        legMeshes[i].forEach((m) => {
          if (on) {
            if (!origMat.has(m)) origMat.set(m, m.material);
            m.material = matHi;
          } else if (origMat.has(m)) {
            m.material = origMat.get(m)!;
            origMat.delete(m);
          }
        });
        wtags[i].classList.toggle('on', on);
        wtags[i].classList.toggle('dim', k !== null && !on);
        wdots[i].forEach((d) => {
          d.classList.toggle('on', on);
          d.classList.toggle('dim', k !== null && !on);
        });
      });
    },
    rotate: (dAz, dEl = 0) => {
      az += dAz;
      el = clampEl(el + dEl);
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      window.removeEventListener('resize', resize);
      overlay.remove();
      renderer.dispose();
    },
  };
}
