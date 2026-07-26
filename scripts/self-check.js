#!/usr/bin/env node
/**
 * Lightweight sanity checks (no browser). Run: npm test
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const required = [
  'manifest.json',
  'src/background.js',
  'src/inject/index.js',
  'src/popup/index.js',
  'src/popup/index.html',
  'src/options/index.js',
  'src/options/index.html',
  'src/shared/presets.js',
  'js/mousetrap.min.js',
  'js/screenfull.min.js'
];

let failed = 0;
const ok = (msg) => console.log('✓', msg);
const fail = (msg) => {
  console.error('✗', msg);
  failed += 1;
};

for (const rel of required) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) ok(`exists ${rel}`);
  else fail(`missing ${rel}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.manifest_version === 3) ok('manifest v3');
else fail('expected manifest_version 3');

if (!manifest.host_permissions) ok('no required host_permissions');
else fail('host_permissions should be optional only');

if (manifest.optional_host_permissions?.length) ok('optional_host_permissions present');
else fail('missing optional_host_permissions');

if (manifest.content_scripts) fail('static content_scripts should be removed (use dynamic registration)');
else ok('no static content_scripts');

if (manifest.permissions.includes('scripting')) ok('scripting permission');
else fail('missing scripting permission');

// Parse presets in a sandbox
const presetsCode = fs.readFileSync(path.join(root, 'src/shared/presets.js'), 'utf8');
const sandbox = { self: {}, console };
vm.createContext(sandbox);
vm.runInContext(presetsCode, sandbox);
const api = sandbox.self.UMC_PRESETS;
if (!api) {
  fail('UMC_PRESETS not defined');
} else {
  ok('presets API loaded');
  const twitchOff = api.resolveSiteProfile('www.twitch.tv', {
    enabledPresets: [],
    custom: {}
  });
  if (!twitchOff) ok('twitch preset off by default (empty enabledPresets)');
  else fail('twitch should not apply when not enabled');

  const twitch = api.resolveSiteProfile('www.twitch.tv', {
    enabledPresets: ['twitch.tv'],
    custom: {}
  });
  if (twitch && twitch.disabledActions.includes('fullscreen')) ok('twitch preset matches when enabled');
  else fail('twitch preset failed');

  const merged = api.mergeHotkeysWithProfile({ playPause: 'x' }, twitch);
  if (merged.fullscreen === '' && merged.playPause === '') ok('profile disables override global remap');
  else fail('mergeHotkeysWithProfile incorrect');

  if (api.defaultEnabledPresetIds().length === 0) ok('no presets enabled by default');
  else fail('defaultEnabledPresetIds should be empty');

  const custom = api.resolveSiteProfile('play.example.com', {
    enabledPresets: [],
    custom: { 'example.com': { disabledActions: ['mute'] } }
  });
  if (custom && custom.disabledActions.includes('mute')) ok('custom profile matches subdomain');
  else fail('custom profile subdomain match failed');
}

// Syntax check main scripts
for (const rel of ['src/inject/index.js', 'src/background.js', 'src/popup/index.js', 'src/options/index.js']) {
  try {
    new Function(fs.readFileSync(path.join(root, rel), 'utf8'));
    ok(`syntax ${rel}`);
  } catch (e) {
    fail(`syntax ${rel}: ${e.message}`);
  }
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
