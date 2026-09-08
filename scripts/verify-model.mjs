import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import validator from 'gltf-validator';

const bytes = await readFile('assets/summer-festival-phase13.glb');
const report = await validator.validateBytes(new Uint8Array(bytes), { maxIssues: 30 });
assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues.messages));
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
assert.equal(gltf.animations.length, 1, 'The scene must share one synchronized loop');
const animation = gltf.animations[0];
for (const sampler of animation.samplers) {
  const time = gltf.accessors[sampler.input];
  assert.equal(time.min[0], 0);
  assert.equal(time.max[0], 20);
}
assert.equal(gltf.nodes.filter(node => node.extras?.layer).length, 19);
for (const name of ['CharacterSample_Root', 'Coral_CharacterSample_Root', 'Sage_CharacterSample_Root', 'Layer_19_OverallBlockout']) {
  assert(gltf.nodes.some(node => node.name === name), `Missing ${name}`);
}
assert(!gltf.buffers.some(buffer => buffer.uri), 'Model must have no external buffer dependency');
console.log('MODEL_PASS', { bytes: bytes.length, layers: 19, channels: animation.channels.length,
  seconds: 20, errors: report.issues.numErrors, warnings: report.issues.numWarnings });
if (report.issues.numWarnings) console.log(report.issues.messages.filter(issue => issue.severity === 1));
