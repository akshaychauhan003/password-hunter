#!/usr/bin/env python3
"""Generate PWA icons for Password Hunter"""
import struct, zlib, os

def make_png(size, r=0, g=255, b=65):
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    raw = b''
    half = size // 2
    for y in range(size):
        row = b'\x00'
        for x in range(size):
            dist = ((x-half)**2 + (y-half)**2) ** 0.5
            if dist < half * 0.75:
                row += bytes([r, g, b])
            elif dist < half * 0.85:
                row += bytes([0, 200, 255])
            else:
                row += bytes([5, 10, 14])
        raw += row
    idat = chunk(b'IDAT', zlib.compress(raw, 6))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

os.makedirs('public/icons', exist_ok=True)
for size in [72, 96, 128, 144, 192, 512]:
    with open(f'public/icons/icon-{size}.png', 'wb') as f:
        f.write(make_png(size))
    print(f'Created icon-{size}.png')
print('All icons created!')
