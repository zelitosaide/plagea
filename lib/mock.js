import { MongoClient } from "mongodb";

// if (!process.env.MONGODB_URI) {
//   throw new Error("Please add your MongoDB URI to .env.local")
// }

// const uri = process.env.MONGODB_URI
const uri = process.env.MONGODB_URI
  ? process.env.MONGODB_URI
  : "mongodb://admin:Admin1234!1@med.uem.mz:27017/todoapp?authSource=admin";

const dbName = process.env.MONGODB_DB ? process.env.MONGODB_DB : "plagea";

const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo =
    global &
    {
      _mongoClientPromise,
    };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log("Connected to MongoDB");
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(dbName);
  return { client, db };
}

export default clientPromise;
