const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Super-sampled AI Superhero Icon Renderer
 */
function renderSuperHeroIcon(targetSize) {
  const scale = 4; // 4x SSAA
  const W = targetSize * scale;
  const H = targetSize * scale;
  const cx = W / 2;
  const cy = H / 2;

  const highRes = new Float32Array(W * H * 4);

  // Superhero Shield Polygon (Diamond / Hero Crest)
  const shieldNorm = [
    [0.0, -0.95],    // Top tip
    [0.86, -0.52],   // Top right
    [0.72, 0.28],    // Mid right
    [0.0, 0.96],     // Bottom point
    [-0.72, 0.28],   // Mid left
    [-0.86, -0.52]   // Top left
  ];

  const shieldPoly = shieldNorm.map(([nx, ny]) => [cx + nx * (W * 0.48), cy + ny * (H * 0.48)]);

  // Bold Superhero Lightning Bolt (⚡)
  const boltNorm = [
    [0.08, -0.72],
    [-0.38, 0.00],
    [-0.04, 0.00],
    [-0.24, 0.72],
    [0.38, -0.04],
    [0.04, -0.04]
  ];
  const boltPoly = boltNorm.map(([nx, ny]) => [cx + nx * (W * 0.46), cy + ny * (H * 0.46)]);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;

      const inShield = pointInPoly(x, y, shieldPoly);
      if (!inShield) {
        highRes[idx] = 0;
        highRes[idx + 1] = 0;
        highRes[idx + 2] = 0;
        highRes[idx + 3] = 0;
        continue;
      }

      const nx = (x - cx) / (W * 0.48);
      const ny = (y - cy) / (H * 0.48);
      const distFromCenter = Math.hypot(nx, ny);

      // Distance to shield boundary
      let minBorderDist = 9999;
      for (let i = 0, j = shieldPoly.length - 1; i < shieldPoly.length; j = i++) {
        const d = distToSegment(x, y, shieldPoly[j][0], shieldPoly[j][1], shieldPoly[i][0], shieldPoly[i][1]);
        if (d < minBorderDist) minBorderDist = d;
      }

      // Base Background: Deep Cosmic Indigo & Midnight Violet
      const vGrad = (ny + 1) / 2; // 0 at top to 1 at bottom
      let r = 10 + vGrad * 16;
      let g = 14 + vGrad * 18;
      let b = 36 + vGrad * 48;
      let a = 255;

      // Radial Energy Core
      const coreEnergy = Math.max(0, 1 - distFromCenter * 1.25);
      r += coreEnergy * 40;
      g += coreEnergy * 75;
      b += coreEnergy * 180;

      // Gemini 4-Point AI Sparkle Star (Diamond Astroid)
      const astroidSize = 0.78;
      const absX = Math.abs(nx);
      const absY = Math.abs(ny);
      const astroidVal = Math.pow(absX / astroidSize, 0.5) + Math.pow(absY / astroidSize, 0.5);

      if (astroidVal <= 1.0) {
        const starInt = Math.pow(1.0 - astroidVal, 0.5);
        // Gemini AI gradient: Electric Cyan to Vivid Lavender
        const starR = 45 + (1 - vGrad) * 120 + starInt * 90;
        const starG = 130 + starInt * 125;
        const starB = 240 + starInt * 15;
        const alphaBlend = starInt * 0.9;

        r = r * (1 - alphaBlend) + starR * alphaBlend;
        g = g * (1 - alphaBlend) + starG * alphaBlend;
        b = b * (1 - alphaBlend) + starB * alphaBlend;
      }

      // Superhero Metallic Border / Beveled Shield Rim
      const borderWidth = scale * (targetSize >= 48 ? 4.5 : 2.5);
      if (minBorderDist < borderWidth) {
        const rimProg = 1 - (minBorderDist / borderWidth);
        // Smooth golden-to-cyan metallic gradient along vertical
        const rimGoldR = 255 * (1 - vGrad * 0.4);
        const rimGoldG = 210 * (1 - vGrad * 0.3);
        const rimGoldB = 60 + vGrad * 180;

        r = r * (1 - rimProg) + rimGoldR * rimProg;
        g = g * (1 - rimProg) + rimGoldG * rimProg;
        b = b * (1 - rimProg) + rimGoldB * rimProg;
      }

      // Superhero Lightning Bolt (⚡) in Foreground
      const inBolt = pointInPoly(x, y, boltPoly);
      if (inBolt) {
        // Find distance to bolt edge for 3D metallic bevel
        let minBoltEdge = 9999;
        for (let i = 0, j = boltPoly.length - 1; i < boltPoly.length; j = i++) {
          const d = distToSegment(x, y, boltPoly[j][0], boltPoly[j][1], boltPoly[i][0], boltPoly[i][1]);
          if (d < minBoltEdge) minBoltEdge = d;
        }

        const boltWidth = scale * (targetSize >= 48 ? 5 : 2.5);
        const edgeFactor = Math.min(1, minBoltEdge / boltWidth);

        // Radiant Golden Lightning to Pure White Hot Core
        const goldR = 255;
        const goldG = 215 + edgeFactor * 40;
        const goldB = 50 + edgeFactor * 205;

        r = goldR;
        g = Math.min(255, goldG);
        b = Math.min(255, goldB);
      }

      // Specular Glass Highlight across top shield
      const glareDist = Math.hypot(nx + 0.3, ny + 0.45);
      if (glareDist < 0.65) {
        const glare = Math.pow(1 - glareDist / 0.65, 2) * 0.28;
        r = Math.min(255, r + glare * 255);
        g = Math.min(255, g + glare * 255);
        b = Math.min(255, b + glare * 255);
      }

      highRes[idx] = Math.max(0, Math.min(255, r));
      highRes[idx + 1] = Math.max(0, Math.min(255, g));
      highRes[idx + 2] = Math.max(0, Math.min(255, b));
      highRes[idx + 3] = a;
    }
  }

  // Downsample highRes -> targetSize with SSAA Box Filter
  const lineLength = targetSize * 4 + 1;
  const rawData = Buffer.alloc(lineLength * targetSize);

  for (let ty = 0; ty < targetSize; ty++) {
    const rawOffset = ty * lineLength;
    rawData[rawOffset] = 0;

    for (let tx = 0; tx < targetSize; tx++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
      let count = 0;

      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const hx = tx * scale + sx;
          const hy = ty * scale + sy;
          const hIdx = (hy * W + hx) * 4;

          const sa = highRes[hIdx + 3] / 255;
          sumR += highRes[hIdx] * sa;
          sumG += highRes[hIdx + 1] * sa;
          sumB += highRes[hIdx + 2] * sa;
          sumA += highRes[hIdx + 3];
          count++;
        }
      }

      const outA = sumA / count;
      const outR = outA > 0 ? (sumR / count) / (outA / 255) : 0;
      const outG = outA > 0 ? (sumG / count) / (outA / 255) : 0;
      const outB = outA > 0 ? (sumB / count) / (outA / 255) : 0;

      const px = rawOffset + 1 + tx * 4;
      rawData[px] = Math.round(outR);
      rawData[px + 1] = Math.round(outG);
      rawData[px + 2] = Math.round(outB);
      rawData[px + 3] = Math.round(outA);
    }
  }

  // Construct PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(targetSize, 0);
  ihdr.writeUInt32BE(targetSize, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

[16, 48, 128].forEach(size => {
  const png = renderSuperHeroIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Generated AI Superhero Icon: ${filePath} (${size}x${size})`);
});
