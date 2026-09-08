import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const el = id => document.getElementById(id);
const labels = {
  '01': '山の庭 · 山间庭院', '02': '参道 · 灯笼石阶', '03': '鳥居 · 夏夜之门',
  '04': '社殿 · 山顶神社', '05': '屋台 · 祭典夜市', '06': '櫓 · 太鼓台',
  '07': '桜 · 夜樱', '08': '松 · 山间青松', '09': '灯火 · 夜祭灯笼',
  '11': '社殿 · 神社与摊位', '12': '桜 · 落地花瓣', '13': '浴衣 · 蓝衣游人',
  '14': '浴衣 · 珊瑚红游人', '15': '浴衣 · 浅绿游人', '16': '桜 · 飘落花瓣',
  '17': '花火 · 夜空烟花', '18': '流星 · 夏夜划痕', '19': '夏祭 · 庭院与人群',
};

async function start() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101d32');
  const camera = new THREE.OrthographicCamera(-22.5, 22.5, 18.75, -18.75, .1, 500);
  camera.position.set(32, 31, 42);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label', '夏祭三维场景，可拖动旋转、缩放和平移');
  el('world').append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4, 0);
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.minZoom = .45;
  controls.maxZoom = 3.5;
  controls.maxPolarAngle = Math.PI * .485;
  controls.minPolarAngle = .12;
  controls.autoRotateSpeed = .38;
  controls.zoomSpeed = .8;
  controls.update();

  scene.add(new THREE.HemisphereLight('#bccbff', '#695354', 1));
  const moonlight = new THREE.DirectionalLight('#bbd0ff', 1.6);
  moonlight.position.set(-13, 28, 2);
  moonlight.castShadow = true;
  moonlight.shadow.mapSize.set(2048, 2048);
  Object.assign(moonlight.shadow.camera, { left: -23, right: 23, top: 23, bottom: -23, near: 1, far: 80 });
  moonlight.shadow.normalBias = .035;
  moonlight.shadow.bias = -.0003;
  scene.add(moonlight);
  const front = new THREE.DirectionalLight('#ffd2a0', .7);
  front.position.set(7, 20, 19);
  scene.add(front);
  for (const [x, y, z, power] of [[0, 9, -6, 75], [0, 5, 3, 60], [-7, 3, 9, 65], [8, 3, 9, 65]]) {
    const light = new THREE.PointLight('#ffb568', power, 15, 2);
    light.position.set(x, y, z);
    scene.add(light);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#101d32', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.9;
  floor.receiveShadow = true;
  scene.add(floor);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .28, .45, 1.1));
  composer.addPass(new OutputPass());
  function resize() {
    const aspect = innerWidth / innerHeight;
    const width = Math.max(45, 37.5 * aspect);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = width / aspect / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  const asset = new URL('./summer-festival-phase13.glb?v=13.1', import.meta.url);
  const gltf = await new GLTFLoader().loadAsync(asset.href, event => {
    // FileLoader reports decoded bytes, while Content-Length may be gzip size.
    // The build records this asset's decoded size; parsing/rendering still remain.
    const percent = Math.max(0, Math.min(99, Math.floor(event.loaded / __MODEL_BYTE_LENGTH__ * 100)));
    el('loading').textContent = `灯火，正在亮起… ${percent}%`;
  });
  const model = gltf.scene;
  scene.add(model);
  const layers = [];
  model.traverse(object => {
    if (object.userData.layer) layers.push(object);
    if (object.isMesh) {
      if (/^10_Stage_Ridge/.test(object.name)) {
        object.material = new THREE.MeshBasicMaterial({ color: object.material.color.clone().multiplyScalar(.65), toneMapped: false });
      }
      object.castShadow = !/Firework|Meteor|Petal|Lantern|DistantMountain|Moon/.test(object.name);
      object.receiveShadow = true;
    }
  });
  const mixer = new THREE.AnimationMixer(model);
  gltf.animations.forEach(clip => mixer.clipAction(clip).play());
  let playing = true;
  let exploded = false;
  let elapsed = 0;
  const home = new THREE.Vector3(32, 31, 42);
  const target = new THREE.Vector3(0, 4, 0);
  function reset() {
    controls.autoRotate = false;
    el('orbit').setAttribute('aria-pressed', 'false');
    camera.position.copy(home);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.target.copy(target);
    controls.update();
  }
  function playbackButton() {
    el('effects').setAttribute('aria-pressed', String(playing));
    el('effects').title = playing ? '暂停动画' : '播放动画';
    el('effects').setAttribute('aria-label', el('effects').title);
    el('effects').querySelector('svg').innerHTML = playing
      ? '<path d="M8 5v14M16 5v14" stroke-width="3"/>' : '<path d="m8 5 11 7-11 7z"/>';
  }
  playbackButton();
  el('reset').onclick = reset;
  el('orbit').onclick = () => {
    controls.autoRotate = !controls.autoRotate;
    el('orbit').setAttribute('aria-pressed', String(controls.autoRotate));
  };
  el('effects').onclick = () => { playing = !playing; playbackButton(); };
  el('explode').onclick = () => {
    exploded = !exploded;
    el('explode').setAttribute('aria-pressed', String(exploded));
    let index = 0;
    for (const layer of layers) {
      if (/^(01|10)_/.test(layer.userData.layer)) continue;
      layer.position.y = exploded ? ++index * .65 : 0;
    }
    el('selection').textContent = exploded ? '分层查看 · 再次点击还原' : '拖动，走进这场夏夜。';
  };
  el('help').onclick = () => {
    el('guide').hidden = !el('guide').hidden;
    el('help').setAttribute('aria-expanded', String(!el('guide').hidden));
  };
  window.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'r') reset();
    if (event.key === 'Escape') { el('guide').hidden = true; el('help').setAttribute('aria-expanded', 'false'); }
  });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = [0, 0];
  renderer.domElement.addEventListener('pointerdown', event => { down = [event.clientX, event.clientY]; });
  renderer.domElement.addEventListener('pointerup', event => {
    if (Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
    pointer.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(model, true)[0];
    if (!hit) return;
    let parent = hit.object;
    while (parent && !parent.userData.layer) parent = parent.parent;
    el('selection').textContent = labels[parent?.userData.layer?.slice(0, 2)] || '夏祭';
  });
  const clock = new THREE.Timer();
  renderer.info.autoReset = false;
  renderer.setAnimationLoop(() => {
    clock.update();
    const delta = Math.min(clock.getDelta(), .05);
    if (playing && !exploded) { elapsed += delta; mixer.update(delta); }
    controls.update();
    renderer.info.reset();
    composer.render();
    el('loading')?.remove();
  });
  window.__festival = {
    scene, camera, controls, renderer, model, mixer, phase: 13, layers,
    clips: gltf.animations, get elapsed() { return elapsed; },
    get playing() { return playing; }, get exploded() { return exploded; },
    stats: () => ({ ...renderer.info.render, layers: layers.length }),
  };
}

start().catch(error => {
  console.error(error);
  el('loading').textContent = '场景暂未加载成功，请刷新重试或使用支持 WebGL 的新版浏览器。';
});
