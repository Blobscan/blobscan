
import { connectToDatabase } from "../../util/mongodb";

async function search(term) {

  if (term.length === 42) {
    return `/address/${term}`
  }
  const { db } = await connectToDatabase();

  const blocks = await db
  .collection("blocks")
  .find({ $or: [ { number: parseInt(term) }, { hash: term }]})
  .limit(1)
  .toArray();

  if (blocks.length > 0) {
    return `/block/${blocks[0].number}`;
  }
  
  const txs = await db
    .collection("txs")
    .find({ hash: term })
    .limit(1)
    .toArray();


  if (txs.length > 0) {
    return `/tx/${txs[0].hash}`;
  }

  const blobs = await db
  .collection("blobs")
  .find({ $or: [ { hash: term }, { commitment: term }]})
  .toArray();

  if (blobs.length > 0) {
    return `/blob/${blobs[0].hash}`;
  }
}

export default async function handler(req, res) {
  const { query: { term } } = req;
  try {
    const url = await search(term)
    if (!url) {
      res.status(404).json({ error: "Not found" })
    } else{
      res.status(200).json({ url })
    }
    

  } catch (e) {
    console.error(e);
    res.status(501).json({ error: e.message })
  }
    
  }
  