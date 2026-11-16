// Generate a reviewable change set. Never writes the working registry or roadmap.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {planCycleTransition} from '../qualification/model.mjs';
const [reviewPath,outputPath]=process.argv.slice(2);
if(!reviewPath||!outputPath)throw Error('Usage: node scripts/plan_cycle_transition.mjs <review.json> <new-output-directory>');
const root=fileURLToPath(new URL('../qualification/',import.meta.url));
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const review=await read(path.resolve(reviewPath)),registry=await read(path.join(root,'cycles_v1.json'));
const cycles=Object.fromEntries(await Promise.all(registry.cycles.map(async e=>[e.id,await read(path.join(root,e.file))])));
const plan=planCycleTransition(registry,cycles,review.targetId,review);
// mkdir without recursive deliberately refuses to overwrite an existing plan directory.
await fs.mkdir(path.resolve(outputPath));await fs.mkdir(path.join(outputPath,'archives'));
await fs.writeFile(path.join(outputPath,'cycles_v1.json'),JSON.stringify(plan.registry,null,2)+'\n');
await fs.writeFile(path.join(outputPath,plan.archive.file),JSON.stringify(plan.archive.data,null,2)+'\n');
console.log('Review plan created. Active settings, history, and production are unchanged.');
