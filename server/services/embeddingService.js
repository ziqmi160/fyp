import { pipeline, env } from '@xenova/transformers';

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
  'Theory of Computing & Algorithms',
];

// Rich descriptions give the model more semantic surface area than short labels.
const CATEGORY_DESCRIPTIONS = {
  'Artificial Intelligence (AI)':
    'Artificial intelligence systems that simulate human reasoning and problem solving. ' +
    'Includes expert systems, knowledge representation, planning, natural language processing, ' +
    'computer vision, autonomous agents, intelligent decision making, and AI ethics.',
  'Machine Learning (ML)':
    'Machine learning algorithms that learn patterns from data. Covers supervised learning, ' +
    'unsupervised learning, deep learning, neural networks, convolutional networks, transformers, ' +
    'classification, regression, clustering, reinforcement learning, model training, and evaluation.',
  'Software Engineering':
    'Software development processes, methodologies, and best practices. Includes agile development, ' +
    'DevOps, software architecture, design patterns, testing, code quality, refactoring, ' +
    'version control, continuous integration, and software project management.',
  'Cybersecurity':
    'Protecting systems, networks, and data from digital attacks and unauthorised access. ' +
    'Covers cryptography, network security, penetration testing, vulnerability assessment, ' +
    'authentication, access control, malware analysis, secure coding, and incident response.',
  'Data Science':
    'Extracting insights and knowledge from structured and unstructured data. Includes statistical ' +
    'analysis, data wrangling, feature engineering, exploratory data analysis, data visualisation, ' +
    'predictive modelling, and working with large-scale datasets and pipelines.',
  'Cloud Computing':
    'Delivering computing services over the internet using cloud platforms such as AWS, Azure, and GCP. ' +
    'Covers serverless computing, containerisation with Docker and Kubernetes, microservices, ' +
    'infrastructure as code, scalable distributed systems, and cloud-native application design.',
  'Database Management':
    'Designing, implementing, and managing databases for efficient data storage and retrieval. ' +
    'Includes relational databases with SQL, NoSQL databases, query optimisation, data modelling, ' +
    'indexing, transactions, replication, and database administration.',
  'Computer Networks':
    'Designing and managing communication networks and protocols. Covers TCP/IP, routing and switching, ' +
    'wireless networks, 5G, software-defined networking, IoT connectivity, network monitoring, ' +
    'performance optimisation, and network architecture.',
  'Web Development':
    'Building web applications and websites for the browser. Includes frontend development with HTML, ' +
    'CSS, and JavaScript frameworks, backend development with REST and GraphQL APIs, responsive design, ' +
    'progressive web apps, web performance, and deployment.',
  'Mobile App Development':
    'Creating applications for smartphones and tablets. Covers native iOS and Android development, ' +
    'cross-platform frameworks such as Flutter and React Native, mobile UI and UX design, ' +
    'offline functionality, push notifications, and app store deployment.',
  'Human-Computer Interaction (HCI)':
    'Designing usable, accessible, and engaging interfaces between humans and computers. ' +
    'Includes user experience design, usability testing, accessibility standards, interaction design, ' +
    'user research methods, interface prototyping, and cognitive ergonomics.',
  'Computer Graphics & Visualization':
    'Creating and manipulating visual content using computational techniques. Covers 3D modelling, ' +
    'real-time rendering, physically based rendering, animation, image processing, scientific ' +
    'visualisation, augmented reality, virtual reality, and shader programming.',
  'Video Game Development':
    'Designing and building interactive video games across platforms. Includes game engine architecture ' +
    'using Unity or Unreal, game mechanics, level design, game AI and pathfinding, physics simulation, ' +
    'procedural generation, multiplayer networking, and game optimisation.',
  'Embedded Systems':
    'Developing software for dedicated and resource-constrained hardware systems. Covers ' +
    'microcontrollers, real-time operating systems, firmware development, IoT devices, sensor ' +
    'integration, hardware-software co-design, FPGA programming, and edge computing.',
  'Theory of Computing & Algorithms':
    'Mathematical foundations of computation and systematic algorithm design. Includes computational ' +
    'complexity theory, data structures, algorithm analysis, formal languages, automata theory, ' +
    'graph algorithms, dynamic programming, and provably correct problem solving.',
};

let _pipeline = null;
let _categoryEmbeddings = null;

async function getPipeline() {
  if (!_pipeline) {
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _pipeline;
}

async function embed(text) {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function getCategoryEmbeddings() {
  if (!_categoryEmbeddings) {
    _categoryEmbeddings = {};
    for (const cat of EXPERTISE_CATEGORIES) {
      _categoryEmbeddings[cat] = await embed(CATEGORY_DESCRIPTIONS[cat]);
    }
  }
  return _categoryEmbeddings;
}

/**
 * Recommend supervisors for a project description.
 *
 * Algorithm mirrors the Python RecommendationEngine:
 *   1. Embed the query against pre-computed rich category description embeddings.
 *   2. For each supervisor, score their best-matching expertise category (primary)
 *      plus a weighted average of remaining categories (secondary tie-breaker).
 *   3. final_score = primary + 0.1 × secondary_mean
 *
 * @param {string} query - The project description (or "title. description").
 * @param {Array}  supervisors - Objects with at least { expertise: string[] }.
 * @param {number} topN
 */
export async function recommendSupervisors(query, supervisors, topN = 3) {
  const queryVec = await embed(query.trim());
  const catEmbeddings = await getCategoryEmbeddings();

  // Pre-compute query similarity against every category (dot = cosine since vecs are normalised)
  const categoryScores = {};
  for (const cat of EXPERTISE_CATEGORIES) {
    categoryScores[cat] = dot(queryVec, catEmbeddings[cat]);
  }

  const scored = supervisors.map(supervisor => {
    const tags = Array.isArray(supervisor.expertise) ? supervisor.expertise : [];

    if (tags.length === 0) {
      return { ...supervisor, match_score: 0, matched_expertise: null };
    }

    const tagScores = tags
      .map(tag => ({ tag, score: categoryScores[tag] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    const primaryScore = tagScores[0].score;
    const bestCategory = tagScores[0].tag;
    const secondaryMean =
      tagScores.length > 1
        ? tagScores.slice(1).reduce((s, t) => s + t.score, 0) / (tagScores.length - 1)
        : 0;

    const finalScore = primaryScore + 0.1 * secondaryMean;

    return {
      ...supervisor,
      match_score: Math.round(finalScore * 10000) / 10000,
      matched_expertise: bestCategory,
    };
  });

  return scored.sort((a, b) => b.match_score - a.match_score).slice(0, topN);
}

// Kept for seeder compatibility — expertise_embedding is no longer used by the engine.
export async function recomputeSupervisorEmbedding(_profile) {}

export async function warmUp() {
  try {
    await getCategoryEmbeddings();
    console.log('Embedding service warmed up.');
  } catch (err) {
    console.warn('Embedding service warm-up failed:', err.message);
  }
}
