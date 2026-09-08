import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Raycaster, Vector3 } from 'three';

test('terrace paving has a distinct surface above its foundation', async () => {
  const bytes = await readFile('assets/summer-festival-phase13.glb');
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  gltf.scene.updateMatrixWorld(true);
  const foundation = gltf.scene.getObjectByName('01_Terrain_Foundation');
  const paving = gltf.scene.getObjectByName('01_Terrain_Stone');
  for (const [x, z] of [[-7, -9], [-10, -8], [10, -13]]) {
    const ray = new Raycaster(new Vector3(x, 15, z), new Vector3(0, -1, 0));
    const top = ray.intersectObject(paving, false)[0];
    const base = ray.intersectObject(foundation, false)[0];
    assert(top && base, 'Both paving and supporting foundation must remain present');
    assert(top.point.y - base.point.y > .035, `Competing terrace surfaces at ${x},${z}: ${top.point.y - base.point.y}`);
  }
});
