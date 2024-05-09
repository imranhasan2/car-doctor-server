const express = require('express');
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const cors = require('cors')


// middleWare

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}))
app.use(express.json())
app.use(cookieParser())







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bhkveen.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});




const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'unauthorized response' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {

        if (err){
            res.status(401).send({message : 'unauthorized token'})
        }
        req.user = decoded;
        next()

    })



}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();



        const servicesCollection = client.db('carDoctor').collection('services')

        //token auth
        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,


                })
                .send({ success: true })

        })



        //service related api

        const ordersCollection = client.db('carDoctor').collection('orders')

        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {

                projection: {
                    title: 1, price: 1, _id: 1, img: 1,

                },
            };
            const result = await servicesCollection.findOne(query, options)

            res.send(result)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log(order)


            const result = await ordersCollection.insertOne(order)
            res.send(result)

        })



        app.get('/orders',verifyToken, async (req, res) => {
            console.log(req.query.email)

           // console.log('token', req.cookies.token)

           console.log('user in valid token', req.user)

           if(req.query.email !== req.user.email){
            return res.status(403).send({message : 'Forbidden Access'})
           }

            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await ordersCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await ordersCollection.findOne(query);
            res.send(result)
        })



        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            console.log(query)
            const result = await ordersCollection.deleteOne(query);

            res.send(result)
        })

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id
            const update = req.body
            console.log(update)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: update.status
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Car doctor server is running')
})

app.listen(port, () => {
    console.log(`car doctor server is running on port ${port}`)
})