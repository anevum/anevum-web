import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui = readFileSync(new URL('../web/src/pages/StudioProjectDoctorV001.tsx',import.meta.url),'utf8');
const workspace = readFileSync(new URL('../web/src/pages/StudioFileWorkspaceV111.tsx',import.meta.url),'utf8');
const css = readFileSync(new URL('../web/src/pages/studio-project-doctor-v001.css',import.meta.url),'utf8');

test('Project Doctor mounts only in the existing private Studio source workspace',()=>{
 assert.match(workspace,/StudioProjectDoctorV001/);
 assert.match(workspace,/studioProjectDoctorEnabled&&/);
 assert.match(workspace,/content\.startsWith\(PREFIX\)\|\|content\.startsWith\(UI_PREFIX\)/);
 assert.match(workspace,/source=\{content\}/);
 assert.match(workspace,/savedSource=\{base\.content\|\|''\}/);
 assert.match(workspace,/revision=\{base\.revision\}/);
 assert.match(workspace,/dirty=\{dirty\}/);
});

test('the new UI is opt-in and uses only local deterministic diagnostics',()=>{
 assert.match(ui,/VITE_STUDIO_PROJECT_DOCTOR_V001==='true'/);
 assert.match(ui,/useMemo\(\(\)=>opened\?diagnoseStudioSource\(source\):null,\[opened,source\]\)/);
 assert.match(ui,/setOpened\(value=>!value\)/);
 assert.match(ui,/No source is sent to a model or Railway/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|WebSocket|EventSource|localStorage|sessionStorage|dangerouslySetInnerHTML|eval\s*\(/);
 assert.doesNotMatch(ui,/onChange|onApply|onSave|deleteFile|studioFileUpdate|publish/i);
});

test('UI and styles retain explicit mobile and reduced-motion coverage',()=>{
 assert.match(ui,/aria-expanded=\{opened\}/);
 assert.match(ui,/role="status"/);
 assert.match(ui,/data-studio-project-doctor="v001"/);
 assert.match(ui,/item\.nextStep/);
 assert.match(ui,/projectDoctorBrief\(result\)/);
 assert.match(ui,/brief\?\.headline/);
 assert.match(ui,/compareProjectDoctorSources\(savedSource,source\)/);
 assert.match(ui,/source!==savedSource/);
 assert.match(ui,/comparison\.counts\.introduced/);
 assert.match(ui,/comparison\.counts\.noLongerReported/);
 assert.match(ui,/no longer reported/);
 assert.match(ui,/Suggested next step:/);
 assert.match(css,/\.cpd-next-step/);
 assert.match(css,/@media\(max-width:570px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/\.cpd-diff-metrics/);
});
