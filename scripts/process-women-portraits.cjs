const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'picture', 'women');
const outputDir = path.join(projectRoot, 'public', 'assets', 'characters', 'women');

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const OUTPUT_NAME_ALIASES = {
  姚玲儿: '姚铃儿',
};

const CORNER_PATCH_RATIO = 0.1;
const BACKGROUND_BRIGHTNESS_MARGIN = 18;
const SEED_DISTANCE_THRESHOLD = 24;
const FILL_DISTANCE_THRESHOLD = 38;
const HALO_TRIM_DISTANCE_THRESHOLD = 24;
const HALO_TRIM_BRIGHTNESS_MARGIN = 18;
const STRONG_FOREGROUND_DISTANCE = 22;
const STRONG_FOREGROUND_BRIGHTNESS_DELTA = 16;
const STRONG_FOREGROUND_CONTRAST = 18;
const SPAN_GAP_LIMIT = 28;
const ENVELOPE_PADDING = 4;
const DILATION_RADIUS = 2;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getPixelIndex = (x, y, width) => (y * width + x) * 4;

const getBrightness = (r, g, b) => (r + g + b) / 3;

const getColorDistance = (r, g, b, reference) =>
  Math.hypot(r - reference[0], g - reference[1], b - reference[2]);

const getNeighborContrast = (data, x, y, width, height) => {
  const offset = getPixelIndex(x, y, width);
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  let maxContrast = 0;

  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (const [nx, ny] of neighbors) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
      continue;
    }
    const neighborOffset = getPixelIndex(nx, ny, width);
    const contrast =
      (Math.abs(r - data[neighborOffset]) +
        Math.abs(g - data[neighborOffset + 1]) +
        Math.abs(b - data[neighborOffset + 2])) /
      3;
    if (contrast > maxContrast) {
      maxContrast = contrast;
    }
  }

  return maxContrast;
};

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

const collectReferenceColor = (data, width, height) => {
  const channels = [[], [], []];
  const patchWidth = Math.max(12, Math.round(width * CORNER_PATCH_RATIO));
  const patchHeight = Math.max(12, Math.round(height * CORNER_PATCH_RATIO));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inTopLeftCorner = x < patchWidth && y < patchHeight;
      const inTopRightCorner = x >= width - patchWidth && y < patchHeight;
      if (!inTopLeftCorner && !inTopRightCorner) {
        continue;
      }

      const index = getPixelIndex(x, y, width);
      const alpha = data[index + 3];
      if (alpha === 0) {
        continue;
      }

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      if (getBrightness(r, g, b) < 180) {
        continue;
      }

      channels[0].push(r);
      channels[1].push(g);
      channels[2].push(b);
    }
  }

  if (channels[0].length === 0) {
    return [245, 245, 245];
  }

  return [median(channels[0]), median(channels[1]), median(channels[2])];
};

const fillSpanGaps = (starts, ends, maxGap) => {
  let previousIndex = -1;

  for (let index = 0; index < starts.length; index += 1) {
    if (starts[index] === -1 || ends[index] === -1) {
      continue;
    }

    if (previousIndex !== -1) {
      const gapSize = index - previousIndex - 1;
      if (gapSize > 0 && gapSize <= maxGap) {
        for (let offset = 1; offset <= gapSize; offset += 1) {
          const ratio = offset / (gapSize + 1);
          starts[previousIndex + offset] = Math.round(starts[previousIndex] + (starts[index] - starts[previousIndex]) * ratio);
          ends[previousIndex + offset] = Math.round(ends[previousIndex] + (ends[index] - ends[previousIndex]) * ratio);
        }
      }
    }

    previousIndex = index;
  }
};

const expandSpans = (starts, ends, size, padding) => {
  for (let index = 0; index < starts.length; index += 1) {
    if (starts[index] === -1 || ends[index] === -1) {
      continue;
    }
    starts[index] = Math.max(0, starts[index] - padding);
    ends[index] = Math.min(size - 1, ends[index] + padding);
  }
};

const dilateMask = (mask, width, height, radius) => {
  const dilated = new Uint8Array(mask);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      if (!mask[pixelIndex]) {
        continue;
      }

      for (let dy = -radius; dy <= radius; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          continue;
        }
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            continue;
          }
          dilated[ny * width + nx] = 1;
        }
      }
    }
  }

  return dilated;
};

const buildProtectionMaps = (data, width, height, referenceColor) => {
  const pixelCount = width * height;
  const distanceMap = new Float32Array(pixelCount);
  const brightnessMap = new Float32Array(pixelCount);
  const strongForeground = new Uint8Array(pixelCount);
  const rowStarts = new Int32Array(height).fill(-1);
  const rowEnds = new Int32Array(height).fill(-1);
  const columnStarts = new Int32Array(width).fill(-1);
  const columnEnds = new Int32Array(width).fill(-1);
  const referenceBrightness = getBrightness(referenceColor[0], referenceColor[1], referenceColor[2]);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const offset = pixelIndex * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const distance = getColorDistance(r, g, b, referenceColor);
      const brightness = getBrightness(r, g, b);
      const brightnessDelta = referenceBrightness - brightness;
      const contrast = getNeighborContrast(data, x, y, width, height);

      distanceMap[pixelIndex] = distance;
      brightnessMap[pixelIndex] = brightness;

      const isStrongForeground =
        distance >= STRONG_FOREGROUND_DISTANCE ||
        brightnessDelta >= STRONG_FOREGROUND_BRIGHTNESS_DELTA ||
        (distance >= 8 && contrast >= STRONG_FOREGROUND_CONTRAST);

      if (!isStrongForeground) {
        continue;
      }

      strongForeground[pixelIndex] = 1;
      rowStarts[y] = rowStarts[y] === -1 ? x : Math.min(rowStarts[y], x);
      rowEnds[y] = Math.max(rowEnds[y], x);
      columnStarts[x] = columnStarts[x] === -1 ? y : Math.min(columnStarts[x], y);
      columnEnds[x] = Math.max(columnEnds[x], y);
    }
  }

  fillSpanGaps(rowStarts, rowEnds, SPAN_GAP_LIMIT);
  fillSpanGaps(columnStarts, columnEnds, SPAN_GAP_LIMIT);
  expandSpans(rowStarts, rowEnds, width, ENVELOPE_PADDING);
  expandSpans(columnStarts, columnEnds, height, ENVELOPE_PADDING);

  const dilatedForeground = dilateMask(strongForeground, width, height, DILATION_RADIUS);
  const protectedMask = new Uint8Array(pixelCount);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const inEnvelope =
        rowStarts[y] !== -1 &&
        rowEnds[y] !== -1 &&
        columnStarts[x] !== -1 &&
        columnEnds[x] !== -1 &&
        x >= rowStarts[y] &&
        x <= rowEnds[y] &&
        y >= columnStarts[x] &&
        y <= columnEnds[x];

      if (inEnvelope || dilatedForeground[pixelIndex]) {
        protectedMask[pixelIndex] = 1;
      }
    }
  }

  return {
    brightnessMap,
    distanceMap,
    hardProtectedMask: dilatedForeground,
    protectedMask,
    referenceBrightness,
  };
};

const isBackgroundCandidate = (distance, brightness, referenceBrightness, distanceThreshold) =>
  brightness >= referenceBrightness - BACKGROUND_BRIGHTNESS_MARGIN && distance <= distanceThreshold;

const trimBackgroundHalo = (visited, hardProtectedMask, distanceMap, brightnessMap, referenceBrightness, width, height) => {
  const queue = [];
  const isTrimCandidate = (pixelIndex) =>
    brightnessMap[pixelIndex] >= referenceBrightness - HALO_TRIM_BRIGHTNESS_MARGIN &&
    distanceMap[pixelIndex] <= HALO_TRIM_DISTANCE_THRESHOLD;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      if (visited[pixelIndex] || hardProtectedMask[pixelIndex] || !isTrimCandidate(pixelIndex)) {
        continue;
      }

      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];

      if (
        neighbors.some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height && visited[ny * width + nx])
      ) {
        visited[pixelIndex] = 1;
        queue.push(pixelIndex);
      }
    }
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixelIndex = queue[head];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
      [x + 1, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }

      const neighborPixelIndex = ny * width + nx;
      if (visited[neighborPixelIndex] || hardProtectedMask[neighborPixelIndex] || !isTrimCandidate(neighborPixelIndex)) {
        continue;
      }

      visited[neighborPixelIndex] = 1;
      queue.push(neighborPixelIndex);
    }
  }
};

const removeConnectedBackground = async (inputPath, outputPath) => {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = [];
  const referenceColor = collectReferenceColor(data, width, height);
  const { brightnessMap, distanceMap, hardProtectedMask, protectedMask, referenceBrightness } = buildProtectionMaps(
    data,
    width,
    height,
    referenceColor,
  );

  const trySeed = (x, y) => {
    const pixelIndex = y * width + x;
    if (visited[pixelIndex] || protectedMask[pixelIndex]) {
      return;
    }
    if (!isBackgroundCandidate(distanceMap[pixelIndex], brightnessMap[pixelIndex], referenceBrightness, SEED_DISTANCE_THRESHOLD)) {
      return;
    }
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixelIndex = queue[head];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }

      const neighborPixelIndex = ny * width + nx;
      if (visited[neighborPixelIndex] || protectedMask[neighborPixelIndex]) {
        continue;
      }

      if (
        !isBackgroundCandidate(
          distanceMap[neighborPixelIndex],
          brightnessMap[neighborPixelIndex],
          referenceBrightness,
          FILL_DISTANCE_THRESHOLD,
        )
      ) {
        continue;
      }

      visited[neighborPixelIndex] = 1;
      queue.push(neighborPixelIndex);
    }
  }

  trimBackgroundHalo(visited, hardProtectedMask, distanceMap, brightnessMap, referenceBrightness, width, height);

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (!visited[pixelIndex]) {
      continue;
    }
    data[pixelIndex * 4 + 3] = 0;
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);
};

const resolveOutputName = (entryName) => {
  const baseName = path.parse(entryName).name;
  return OUTPUT_NAME_ALIASES[baseName] ?? baseName;
};

const main = async () => {
  ensureDir(outputDir);

  const entries = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));

  const results = [];

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const outputName = resolveOutputName(entry.name);
    const outputPath = path.join(outputDir, `${outputName}.png`);
    await removeConnectedBackground(sourcePath, outputPath);
    results.push({
      source: path.relative(projectRoot, sourcePath).replace(/\\/g, '/'),
      output: path.relative(projectRoot, outputPath).replace(/\\/g, '/'),
    });
  }

  console.log(JSON.stringify({ processed: results.length, results }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
