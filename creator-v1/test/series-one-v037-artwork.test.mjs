import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../web/public/assets/levels/series-one-v037/', import.meta.url));
const read = name => readFileSync(join(root,name));
const manifest = JSON.parse(read('manifest.json').toString('utf8'));

test('V037 ships a complete canonical transparent preview collection',()=>{
  assert.equal(manifest.version,'v037');
  assert.equal(manifest.type,'transparent-preview-not-hd-masters');
  assert.equal(manifest.items.length,60);
  const hashes=new Set();
  for(let level=1;level<=60;level++){
    const item=manifest.items[level-1];
    const filename='level-'+String(level).padStart(2,'0')+'.webp';
    assert.equal(item.level,level);
    assert.equal(item.file,filename);
    const data=read(filename);
    assert.equal(data.toString('ascii',0,4),'RIFF');
    assert.equal(data.toString('ascii',8,12),'WEBP');
    assert.equal(data.toString('ascii',12,16),'VP8X','requires extended WebP for transparent pixels');
    assert.ok(data[20]&0x10,'alpha flag must be present');
    assert.equal(data.readUIntLE(24,3)+1,256,'artwork width must be 256');
    assert.equal(data.readUIntLE(27,3)+1,256,'artwork height must be 256');
    const digest=createHash('sha256').update(data).digest('hex');
    assert.equal(digest,item.sha256,filename);
    assert.ok(!hashes.has(digest),'each level must have its own binary');
    hashes.add(digest);
  }
});
