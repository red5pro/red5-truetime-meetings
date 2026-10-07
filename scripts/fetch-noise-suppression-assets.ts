import fs from 'fs';
import path from 'path';

// The conference SDK loads DeepFilterNet3 assets from `${assetsUrl}/v3/...`. The upstream CDN only
// sends CORS headers for its own origin, so we mirror the assets into public/ and serve them
// same-origin.
const SOURCE_URL = 'https://cdn.mezon.ai/AI/models/datas/noise_suppression/deepfilternet3';
const TARGET_DIR = 'public/noise-suppression';
const ASSETS = ['v3/pkg/df_bg.wasm', 'v3/models/DeepFilterNet3_onnx.tar.gz'];

async function download(asset: string): Promise<void> {
  const target = path.join(TARGET_DIR, asset);

  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    console.log(`Noise suppression asset already present: ${target}`);
    return;
  }

  const response = await fetch(`${SOURCE_URL}/${asset}`);
  if (!response.ok) {
    throw new Error(`Failed to download ${asset}: ${response.status} ${response.statusText}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.download`;
  fs.writeFileSync(tmp, Buffer.from(await response.arrayBuffer()));
  fs.renameSync(tmp, target);
  console.log(`Downloaded noise suppression asset: ${target}`);
}

try {
  await Promise.all(ASSETS.map(download));
} catch (error) {
  // Don't block the build; noise suppression fails gracefully at runtime without the assets.
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn('Noise suppression asset download failed:', errorMessage);
}
