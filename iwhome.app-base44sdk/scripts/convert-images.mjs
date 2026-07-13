import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, parse } from 'path';

const srcDir = process.argv[2];
if (!srcDir) {
  console.error('Usage: node scripts/convert-images.mjs <source-directory>');
  process.exit(1);
}
if (!existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

const outDir = join('public', 'foto');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));

if (files.length === 0) {
  console.log('No images found to convert.');
  process.exit(0);
}

files.forEach((f, i) => {
  const ext = parse(f).ext.toLowerCase();
  const outPath = join(outDir, `foto-${i + 1}.webp`);
  if (ext === '.webp') {
    copyFileSync(join(srcDir, f), outPath);
  } else {
    sharp(join(srcDir, f))
      .webp({ quality: 80 })
      .toFile(outPath);
  }
});

console.log(`Converted ${files.length} images to WebP → ${outDir}`);
