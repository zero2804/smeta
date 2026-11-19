// Рисует иконки приложения (PNG) без сторонних библиотек: node tools/make-icons.js
const zlib = require('zlib'), fs = require('fs'), path = require('path');
function crc32(buf) { let c, crc = ~0; for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(size, shade) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) { const [r, g, b, a] = shade(x / size, y / size); const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const BLUE = [31, 78, 121, 255], WHITE = [255, 255, 255, 255], ORANGE = [242, 153, 74, 255];
function shade(u, v) {
  // крыша (оранжевый шеврон)
  const cx = 0.5, roofTop = 0.2, roofBase = 0.47, half = 0.36, th = 0.075;
  const yLine = roofBase - (roofBase - roofTop) * (1 - Math.abs(u - cx) / half);
  if (Math.abs(u - cx) <= half && v >= yLine && v <= yLine + th * 1.4) return ORANGE;
  // лист сметы (белый) со строками
  if (u > 0.27 && u < 0.73 && v > 0.47 && v < 0.82) {
    for (const ly of [0.55, 0.63, 0.71]) if (v > ly && v < ly + 0.035 && u > 0.33 && u < (ly === 0.71 ? 0.55 : 0.67)) return BLUE;
    return WHITE;
  }
  return BLUE;
}
const out = path.join(__dirname, '..', 'icons');
for (const s of [192, 512]) fs.writeFileSync(path.join(out, `icon-${s}.png`), png(s, shade));
console.log('ok');
