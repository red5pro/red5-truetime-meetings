import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// The conference SDK loads DeepFilterNet3 assets from `${assetsUrl}/v3/...`. We mirror them into
// public/ and serve them same-origin.
//
// cdn.mezon.ai (the deepfilternet3-noise-filter package's default host) used to be the source, but
// it now answers 403 to every request. The model comes from the upstream DeepFilterNet repo instead.
// The wasm must match the wasm-bindgen glue inlined in deepfilternet3-noise-filter@1.3.0; we host
// that build as an asset on this repo's GitHub release RELEASE_TAG. When upgrading the package,
// publish its wasm under a new tag and update RELEASE_TAG and the hash. NOISE_SUPPRESSION_MIRROR_URL
// (a base URL serving `v3/pkg/df_bg.wasm` and `v3/models/...`) is tried first when set.
// Hashes are pinned so an error page or a wasm built for another package version is never installed.
const TARGET_DIR = 'public/noise-suppression';
const MEZON_CDN = 'https://cdn.mezon.ai/AI/models/datas/noise_suppression/deepfilternet3';
const RELEASE_TAG = 'noise-suppression-assets-1.3.0';
const RELEASE_URL = `https://github.com/red5pro/red5-truetime-meetings/releases/download/${RELEASE_TAG}`;
const MIRROR = process.env.NOISE_SUPPRESSION_MIRROR_URL?.replace(/\/+$/, '');

interface Asset {
  path: string;
  sha256: string;
  sources: string[];
}

const ASSETS: Asset[] = [
  {
    path: 'v3/pkg/df_bg.wasm',
    sha256: '440b5d12b6ea7d95008736f844221d7874ee15de5cb10d3015002470fdba0432',
    sources: [`${RELEASE_URL}/df_bg.wasm`, `${MEZON_CDN}/v3/pkg/df_bg.wasm`],
  },
  {
    path: 'v3/models/DeepFilterNet3_onnx.tar.gz',
    sha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616',
    sources: [
      'https://github.com/Rikorose/DeepFilterNet/raw/main/models/DeepFilterNet3_onnx.tar.gz',
      `${MEZON_CDN}/v3/models/DeepFilterNet3_onnx.tar.gz`,
    ],
  },
];

const sha256 = (data: Buffer): string => crypto.createHash('sha256').update(data).digest('hex');

async function download(asset: Asset): Promise<void> {
  const target = path.join(TARGET_DIR, asset.path);

  if (fs.existsSync(target) && sha256(fs.readFileSync(target)) === asset.sha256) {
    console.log(`Noise suppression asset already present: ${target}`);
    return;
  }

  const sources = MIRROR ? [`${MIRROR}/${asset.path}`, ...asset.sources] : asset.sources;
  const failures: string[] = [];

  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        failures.push(`${url}: HTTP ${response.status}`);
        continue;
      }
      const data = Buffer.from(await response.arrayBuffer());
      const hash = sha256(data);
      if (hash !== asset.sha256) {
        failures.push(`${url}: unexpected SHA-256 ${hash}`);
        continue;
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const tmp = `${target}.download`;
      fs.writeFileSync(tmp, data);
      fs.renameSync(tmp, target);
      console.log(`Downloaded noise suppression asset: ${target} (from ${url})`);
      return;
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Could not download ${asset.path}:\n  ${failures.join('\n  ')}`);
}

const results = await Promise.allSettled(ASSETS.map(download));
const errors = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []));

if (errors.length > 0) {
  // Don't block the build; noise suppression fails gracefully at runtime without the assets.
  console.warn(
    '\n⚠️  Noise suppression assets missing; noise suppression will not work in this build.',
  );
  for (const error of errors) console.warn(error instanceof Error ? error.message : error);
  console.warn(
    `Check the ${RELEASE_TAG} release, set NOISE_SUPPRESSION_MIRROR_URL, or copy the files into ${TARGET_DIR}/.\n`,
  );
}
