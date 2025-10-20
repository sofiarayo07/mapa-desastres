import { MongoClient } from "mongodb";

const uri = "mongodb+srv://diana_db_user:gSLcttEAyRHX4m26@cluster0.ixzjiea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("miBase");
    const col = db.collection("misDatos");

    await col.insertOne({ nombre: "Diana", edad: 22 });
    const docs = await col.find().toArray();
    console.log(docs);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
