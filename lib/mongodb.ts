import { MongoClient, type Db } from "mongodb";

function resolveUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Please add your MongoDB URI to the MONGODB_URI environment variable.");
  }

  // Local dev-only fallback, never used in production.
  return "mongodb://admin:Admin1234!1@127.0.0.1:27017/todoapp?authSource=admin";
}

const options = {};

// A ligação só é mesmo criada na primeira chamada a connectToDatabase(),
// nunca ao carregar o módulo — o "next build" importa este ficheiro
// (via lib/auth.ts) para recolher metadados das rotas de API, sem
// MONGODB_URI definido (é um segredo de runtime, nunca fica na imagem
// Docker); se a ligação fosse criada ao nível do módulo, isso já
// chegava para rebentar o build com o erro de "MONGODB_URI em falta".
let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const uri = resolveUri();

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    clientPromise = new MongoClient(uri, options).connect();
  }

  return clientPromise;
}

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB ? process.env.MONGODB_DB : "plagea";
  const db = client.db(dbName);
  return { client, db };
}
