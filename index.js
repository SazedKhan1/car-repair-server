const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config()

const port = process.env.PORT || 5000;

const app = express()
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vi0yhuk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ meassage: 'unauthorazed access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ meassage: 'Forbidden access' })
        }
        req.decoded = decoded
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('car-repair').collection('services')
        const orderCollection = client.db('car-repair').collection('orders')

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services)
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })
        // order api 
        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {

            }
            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        })

        // JWT token 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, { expiresIn: '10h' })
            res.send({ token })
        })


        app.post('/orders', async (req, res) => {

            const order = req.body;
            const result = await orderCollection.insertOne(order)

            res.send(result)
        })
        // update

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        // delete operation 

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })
    } finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Car repair running')
})


app.listen(port, () => {
    console.log(`Car repair runnning on the port ${port}`);
})
