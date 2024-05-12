const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://altinfohub.web.app"],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xzzvi9v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const queriesCollection = client.db("altInfo").collection("queries");

    app.get("/queries", async (req, res) => {
      const cursor = queriesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // post data
    app.post("/queries", async (req, res) => {
      const newQuery = req.body;
      // console.log(newQuery);
      const result = await queriesCollection.insertOne(newQuery);
      console.log(result);
      res.send(result);
    });

    // get data via email

    app.get("/myQueries", async (req, res) => {
      const userEmail = req.query.userEmail;
      console.log(userEmail);

      const result = await queriesCollection
        .find({ "userInfo.userEmail": userEmail })
        .toArray();

      res.send(result);
    });

    // get single product
    app.get("/singleQueries/:id", async (req, res) => {
      const result = await queriesCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      console.log(result);
      res.send(result);
    });

    app.put("/updateQueries/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const data = {
        $set: {
          productName: req.body.productName,
          productBrand: req.body.productBrand,
          productImageURL: req.body.productImageURL,
          queryTitle: req.body.queryTitle,
          boycottingReason: req.body.boycottingReason,
        },
      };
      const result = await queriesCollection.updateOne(query, data);
      res.send(result);
    });

    // delete
    app.delete("/delete/:id", async (req, res) => {
      const result = await queriesCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
