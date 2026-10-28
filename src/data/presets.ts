import { EvaluationPreset, SampleQA } from '../types';

export const EVALUATION_PRESETS: EvaluationPreset[] = [
  {
    id: 'university-academic',
    name: 'University exam',
    description: 'Evaluates understanding of key concepts, technical accuracy, clear explanations, and real-world examples.',
    defaultTotalMarks: 20,
    parameters: [
      {
        id: 'p1',
        name: 'Understanding core concepts',
        weight: 6,
        description: 'Examines core ideas, theories, depth of explanation, and absence of misconceptions.',
      },
      {
        id: 'p2',
        name: 'Technical accuracy & details',
        weight: 5,
        description: 'Correctness of terminology, technical details, formulas, or defined mechanisms.',
      },
      {
        id: 'p3',
        name: 'Clear structure & explanation',
        weight: 5,
        description: 'Clear flow of ideas from start to finish with organized, well-connected paragraphs.',
      },
      {
        id: 'p4',
        name: 'Real-world examples & application',
        weight: 4,
        description: 'Applying concepts to concrete examples, diagrams, or practical scenarios.',
      },
    ],
  },
  {
    id: 'software-engineering',
    name: 'Software / system design',
    description: 'Evaluates solution correctness, time and memory efficiency, edge cases, and clean architecture.',
    defaultTotalMarks: 25,
    parameters: [
      {
        id: 'se1',
        name: 'Correctness & logic',
        weight: 8,
        description: 'Does the answer correctly solve the problem without logical flaws or bugs?',
      },
      {
        id: 'se2',
        name: 'Efficiency & complexity',
        weight: 6,
        description: 'Clear time and memory analysis (Big-O) and performance considerations.',
      },
      {
        id: 'se3',
        name: 'Handling edge cases',
        weight: 6,
        description: 'Handling empty inputs, boundary cases, unexpected conditions, and failures.',
      },
      {
        id: 'se4',
        name: 'Clean design & structure',
        weight: 5,
        description: 'Clear modular design, clean naming, and sensible abstractions.',
      },
    ],
  },
  {
    id: 'civil-services',
    name: 'Job and civil service exams',
    description: 'Evaluates answering the direct question, covering multiple angles, citing facts or policies, and balanced conclusions.',
    defaultTotalMarks: 15,
    parameters: [
      {
        id: 'cs1',
        name: 'Answering the main question',
        weight: 4,
        description: 'Direct response to the question prompt without drifting off-topic.',
      },
      {
        id: 'cs2',
        name: 'Covering multiple perspectives',
        weight: 4,
        description: 'Looking at social, economic, policy, and practical angles of the issue.',
      },
      {
        id: 'cs3',
        name: 'Facts, evidence & policies',
        weight: 4,
        description: 'Backing points with concrete facts, real data, or official policies.',
      },
      {
        id: 'cs4',
        name: 'Balanced view & forward path',
        weight: 3,
        description: 'A thoughtful, constructive conclusion with practical recommendations.',
      },
    ],
  },
  {
    id: 'essay-language',
    name: 'Essay and writing',
    description: 'Evaluates thesis development, smooth transitions, vocabulary precision, and grammatical variety.',
    defaultTotalMarks: 10,
    parameters: [
      {
        id: 'el1',
        name: 'Main point & argument depth',
        weight: 3,
        description: 'A clear central point supported by strong, relevant points throughout.',
      },
      {
        id: 'el2',
        name: 'Flow & transitions',
        weight: 2.5,
        description: 'Natural transitions between paragraphs and smooth progression of thoughts.',
      },
      {
        id: 'el3',
        name: 'Vocabulary & tone',
        weight: 2.5,
        description: 'Natural, clear vocabulary appropriate for the topic without awkward jargon.',
      },
      {
        id: 'el4',
        name: 'Grammar & sentence structure',
        weight: 2,
        description: 'Grammatically sound sentences with natural variety and clarity.',
      },
    ],
  },
];

export const SAMPLE_QA_LIST: SampleQA[] = [
  {
    id: 'sample-db-acid',
    title: 'Computer Science: ACID Properties & Concurrency',
    category: 'Computer Science',
    totalMarks: 20,
    presetId: 'university-academic',
    question: `Explain the ACID properties of relational database management systems. How do transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) mitigate common concurrency anomalies such as dirty reads, non-repeatable reads, and phantom reads?`,
    modelAnswer: `ACID encompasses:
1. Atomicity: All operations in a transaction succeed or all roll back (managed via Write-Ahead Logging/undo logs).
2. Consistency: Transactions bring DB from one valid state to another satisfying all schema invariants and constraints.
3. Isolation: Concurrent transactions execute without mutual interference.
4. Durability: Committed changes survive system failures (redo logs).

Isolation Levels vs. Anomalies:
- Read Uncommitted: Permits dirty reads (reading uncommitted mutations), non-repeatable reads, phantom reads.
- Read Committed: Prevents dirty reads using row-level read locks released immediately or MVCC snapshotting. Still allows non-repeatable and phantom reads.
- Repeatable Read: Prevents dirty reads and non-repeatable reads (shared locks held until transaction commit). Can still suffer phantom reads in traditional lock managers without range locking.
- Serializable: Prevents all anomalies via two-phase locking (2PL) with index range locks or serializable snapshot isolation (SSI).`,
    studentAnswer: `ACID stands for Atomicity, Consistency, Isolation, and Durability.
Atomicity means all-or-nothing: if any query fails, everything is rolled back using WAL.
Consistency ensures that database constraints like foreign keys and unique constraints are never broken.
Durability means once you commit, the data stays on disk even if the power gets cut.

Isolation is about what happens when two users run queries at the exact same moment. Databases have four isolation levels:
1. Read Uncommitted: The lowest level. You can see another transaction's changes before they commit, which is called a dirty read.
2. Read Committed: You only read committed data, which solves dirty reads. But if another transaction commits changes between your two reads, you get different rows (non-repeatable read).
3. Repeatable Read: If you read a row once, reading it again will give the exact same values. However, if another transaction inserts new rows matching your query filter, those new rows might show up, which is a phantom read.
4. Serializable: The strictest level where transactions happen as if they were strictly one after another. It prevents dirty reads, non-repeatable reads, and phantoms using range locks or SSI.

In practice, systems like PostgreSQL use MVCC for Read Committed and Repeatable Read to avoid locking read operations.`,
  },
  {
    id: 'sample-ai-labor',
    title: 'Economics: AI Impact on Developing Nation Labor',
    category: 'Public Policy & Economics',
    totalMarks: 15,
    presetId: 'civil-services',
    question: `Critically examine the implications of generative artificial intelligence and robotic process automation on the manufacturing and service outsourcing sectors of developing economies. Suggest policy interventions to mitigate workforce displacement.`,
    modelAnswer: `Directive: Critically Examine (both disruptive risks and strategic leapfrogging opportunities, backed by structured policy response).
Key aspects:
1. Service Sector Vulnerability: Business Process Outsourcing (BPO), call centers, and basic IT coding face automation pressures as LLMs achieve human parity in routine cognitive tasks.
2. Manufacturing & Robotics: Developing nations risk "premature de-industrialization" if advanced robotic automation reshores high-value production to developed markets.
3. Leapfrogging Opportunities: AI-augmented diagnostics in rural healthcare, digital agriculture advisories, vernacular translation democratizing e-governance and education.
4. Policy Interventions: Reskilling funds (national skilling voucher programs), infrastructure investment (AI compute commons), labor market transition insurance, and attracting high-tier data curation/annotation ecosystems.`,
    studentAnswer: `Generative AI and automation represent both an existential challenge and an unprecedented modernization lever for emerging markets.

In the service sector, particularly in countries like India, the Philippines, and Bangladesh, the IT-BPO industry generates significant foreign exchange and urban white-collar employment. Generative AI tools handle tier-1 customer inquiries, basic software QA, and data translation at near-zero marginal cost, creating immediate employment contraction for junior workers. Furthermore, global companies may reduce reliance on offshore call centers.

In manufacturing, automated smart factories in developed nations reduce the competitive advantage of low-cost labor, accelerating premature de-industrialization where developing nations struggle to transition surplus agrarian labor into industrial hubs.

However, opportunities exist in deploying specialized AI applications for smallholder agricultural yields, localized telemedicine, and vernacular digital commerce.

Policy Recommendations:
1. Transition Skilling Fund: Reorient vocational curricula toward AI tool proficiency, data labelling, and high-complexity system validation.
2. National Compute Infrastructure: Subsidize sovereign cloud infrastructure so local startups and universities are not dependent on foreign closed-source monopolies.
3. Social Safety Net Modernization: Introduce transitional portable benefits and wage-insurance cushions for displaced BPO personnel.`,
  },
  {
    id: 'sample-dijkstra-code',
    title: 'Algorithms: Shortest Path Optimization',
    category: 'Computer Science',
    totalMarks: 25,
    presetId: 'software-engineering',
    question: `Explain Dijkstra's algorithm for finding single-source shortest paths in a weighted graph with non-negative edge weights. Discuss why it fails with negative weights, and analyze its asymptotic time complexity when implemented with an adjacency list and min-heap versus a Fibonacci heap.`,
    studentAnswer: `Dijkstra's algorithm finds the shortest distance from a starting node to all other nodes in a graph where edge weights are non-negative.

It works greedily:
1. Initialize distances to all vertices as infinity, with dist[source] = 0.
2. Insert (dist[source], source) into a min-priority queue.
3. While the queue is not empty, extract the vertex u with minimum distance.
4. For each neighbor v of u with edge weight w, if dist[u] + w < dist[v], relax the edge and update dist[v] in the priority queue.
5. Mark u as visited. Because edge weights are non-negative, the distance to u is globally optimal when extracted.

Why it fails on negative weights:
Dijkstra relies on the greedy invariant that once a node is extracted from the min-heap, its shortest path is permanently finalized. If negative edges exist, a longer positive path visited later might decrease in total cost through a negative edge, invalidating previously closed nodes. For negative edges, Bellman-Ford or SPFA must be used instead.

Time Complexity:
- With an Adjacency List and Binary Min-Heap:
  Extract-Min takes O(log V), performed V times -> O(V log V).
  Decrease-Key / Edge relaxation takes O(log V), performed at most E times -> O(E log V).
  Total time: O((V + E) log V). For connected graphs where E >= V, this is O(E log V).

- With a Fibonacci Heap:
  Extract-Min takes O(log V) amortized.
  Decrease-Key takes O(1) amortized.
  Total time is O(E + V log V), which is asymptotically superior for dense graphs where E is close to V^2.`,
  },
];
