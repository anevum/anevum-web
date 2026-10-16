#!/usr/bin/env python3
"""Install verified Series One WebP artwork without enabling any website feature."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile

SIZES = (128, 512, 1254)
ARCHIVE_ROOT = 'ANEVUM-Series-One'
DESTINATION = Path('creator-v1/web/public/assets/levels/illustrated')

def install(archive: Path, repository: Path) -> int:
    with ZipFile(archive) as bundle:
        entries = json.loads(bundle.read(ARCHIVE_ROOT + '/manifest.json'))['artifacts']
        if len(entries) != 60 or {a.get('level') for a in entries} != set(range(1, 61)):
            raise ValueError('Require exactly the original sixty level IDs')
        verified = {}
        # Verify every byte before writing any file to the repository.
        for entry in entries:
            level = entry['level']
            for size in SIZES:
                info = entry['webp'].get(str(size), {})
                name = f'web-optimized/{size}/level-{level:02d}.webp'
                if info.get('path') != name or not info.get('sha256'):
                    raise ValueError('Invalid manifest path or checksum: ' + name)
                payload = bundle.read(ARCHIVE_ROOT + '/' + name)
                if not 100 <= len(payload) <= 2_000_000:
                    raise ValueError('Suspicious artwork length: ' + name)
                if payload[:4] != b'RIFF' or payload[8:12] != b'WEBP':
                    raise ValueError('Not WebP: ' + name)
                if hashlib.sha256(payload).hexdigest() != info['sha256']:
                    raise ValueError('Art checksum mismatch: ' + name)
                verified[size, level] = payload
        output = repository / DESTINATION
        for (size, level), payload in verified.items():
            folder = output / str(size)
            folder.mkdir(parents=True, exist_ok=True)
            (folder / f'level-{level:02d}.webp').write_bytes(payload)
        return len(verified)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path, help='Owner-approved Series One HD zip archive')
    parser.add_argument('--repository', default='.', type=Path, help='Repository checkout root')
    args = parser.parse_args()
    amount = install(args.archive, args.repository)
    print(f'Verified and installed {amount} WebP artwork files; visual flag unchanged.')

if __name__ == '__main__':
    main()
