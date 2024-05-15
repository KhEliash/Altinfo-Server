const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://altinfohub.web.app",
      "https://altinfohub.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xzzvi9v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log('middle',token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
// in development server secure will false .  in production secure will be true

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const queriesCollection = client.db("altInfo").collection("queries");
    const recommendationCollection = client
      .db("altInfo")
      .collection("recommendation");

    // token api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log("user token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      // console.log("object", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // get all data
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
      // console.log(result);
      res.send(result);
    });

    // get data via email

    app.get("/myQueries", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      // console.log(userEmail);
      // console.log("ciiiillk", req.user.email);
      if (req.user.email !== userEmail) {
        return res.status(403).send({ message: "unauthorized access" });
      }

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
      // console.log(result);
      res.send(result);
    });

    // post recommendation data
    app.post("/recommendation", async (req, res) => {
      const newQuery = req.body;
      // console.log(newQuery);
      const result = await recommendationCollection.insertOne(newQuery);
      // console.log(result);
      res.send(result);
    });

    app.get("/recom", async (req, res) => {
      const id = req.query.queryId;
      // console.log(id);
      const result = await recommendationCollection
        .find({ queryId: id })
        .toArray();
      // console.log(result);
      res.send(result);
    });

    // get my recom
    app.get("/myrecom", async (req, res) => {
       
      const id = req.query.email;
      const result =await recommendationCollection.find({RecommenderEmail: id}).toArray();
      // console.log(result);
      res.send(result);
    })
      // recom delete 
      app.delete("/delete/:id", async (req, res) => {
        const result = await recommendationCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      });


    app.put("/updateQuerie/:id", async (req, res) => {
      const queryId = req.params.id;
      const objectId = new ObjectId(queryId);
      const query = { _id: objectId };
      const update = { $inc: { "userInfo.recommendationCount": 1 } };
      const result = await queriesCollection.updateOne(query, update);

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
    // await client.db("admin").command({ ping: 1 });
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
