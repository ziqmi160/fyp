import { pipeline, env } from '@xenova/transformers';

// Use Node.js ONNX runtime, not browser shim
env.allowLocalModels = false;
env.useBrowserCache = false;

export const EXPERTISE_CATEGORIES = [
  'Artificial Intelligence (AI)',
  'Machine Learning (ML)',
  'Software Engineering',
  'Cybersecurity',
  'Data Science',
  'Cloud Computing',
  'Database Management',
  'Computer Networks',
  'Web Development',
  'Mobile App Development',
  'Human-Computer Interaction (HCI)',
  'Computer Graphics & Visualization',
  'Video Game Development',
  'Embedded Systems',
  'Theory of Computing & Algorithms'
];

let _pipeline = null;
// Pre-computed embeddings for each category label, keyed by label string
let _categoryEmbeddings = null;

async function getPipeline() {
  if (!_pipeline) {
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _pipeline;
}

// Mean-pool and L2-normalize the model output
function poolAndNormalize(output) {
  const data = output.data;
  const [, seqLen, hiddenSize] = output.dims;
  const vec = new Array(hiddenSize).fill(0);

  for (let t = 0; t < seqLen; t++) {
    for (let h = 0; h < hiddenSize; h++) {
      vec[h] += data[t * hiddenSize + h];
    }
  }
  for (let h = 0; h < hiddenSize; h++) vec[h] /= seqLen;

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

export async function getEmbedding(text) {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  // Xenova's API returns a Tensor; access raw data
  return Array.from(output.data);
}

export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

async function getCategoryEmbeddings() {
  if (!_categoryEmbeddings) {
    _categoryEmbeddings = {};
    for (const cat of EXPERTISE_CATEGORIES) {
      _categoryEmbeddings[cat] = await getEmbedding(cat);
    }
  }
  return _categoryEmbeddings;
}

// Compute and store embedding for a supervisor profile based on their selected expertise categories
export async function recomputeSupervisorEmbedding(profile) {
  const categories = profile.expertise; // getter returns array
  if (!categories || categories.length === 0) {
    await profile.update({ expertise_embedding: null });
    return;
  }

  const catEmbeddings = await getCategoryEmbeddings();
  const size = Object.values(catEmbeddings)[0].length;
  const avg = new Array(size).fill(0);

  for (const cat of categories) {
    const emb = catEmbeddings[cat];
    if (emb) {
      for (let i = 0; i < size; i++) avg[i] += emb[i];
    }
  }
  for (let i = 0; i < size; i++) avg[i] /= categories.length;

  await profile.update({ expertise_embedding: JSON.stringify(avg) });
}

// Warm up: pre-load model and pre-compute category embeddings at server start
export async function warmUp() {
  try {
    await getCategoryEmbeddings();
    console.log('Embedding service warmed up.');
  } catch (err) {
    console.warn('Embedding service warm-up failed:', err.message);
  }
}
