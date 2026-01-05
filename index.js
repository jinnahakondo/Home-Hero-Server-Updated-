const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
require('dotenv').config()
const cors = require('cors')
const { validateService, validateBooking, validateReview } = require('./middleware/validation')
const app = express()
const port = process.env.PORT || 3000;


// <--------firebase admin-------->
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// </-------firebase admin-------->


// middlewere
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://home-hero-b7a6e.web.app',
        'https://home-hero-b7a6e.firebaseapp.com'
    ],
    credentials: true
}))
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

const verifyFBToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: "unauthorized access" })
    }
    const token = authorization.split(' ')[1]
    try {
        const decoded = await admin.auth().verifyIdToken(token)
        req.token_email = decoded.email;
        next()
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).send({ message: "unauthorized access" })
    }
}


// <-------mongodb------->
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.askanda.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // await client.connect();
        const homeHeroDB = client.db('HomeHeroDB')
        // users collection 
        const usersColl = homeHeroDB.collection('users')

        const servicesColl = homeHeroDB.collection('Services')

        // booking collection
        const bookingColl = homeHeroDB.collection("bookings")

        // <----------apis here--------->
        // users related apis 

        app.post('/users', async (req, res) => {
            try {
                const user = req.body;

                // check user info is already in db 
                const userExist = await usersColl.findOne({ userEmail: user.userEmail })

                if (userExist) {
                    return res.send({ message: 'user is already in collection' })
                }
                else {
                    // Add timestamp
                    user.created_at = new Date();
                    const result = await usersColl.insertOne(user);
                    res.send(result)
                }
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).send({ message: 'Failed to create user', error: error.message });
            }
        })

        //get user role
        app.get('/users/role', verifyFBToken, async (req, res) => {
            try {
                const userEmail = req.token_email;
                const result = await usersColl.findOne({ userEmail })
                if (!result) {
                    return res.status(404).send({ message: 'User not found' });
                }
                res.send(result)
            } catch (error) {
                console.error('Error fetching user role:', error);
                res.status(500).send({ message: 'Failed to fetch user role', error: error.message });
            }
        })

        // get all services 
        app.get('/services', async (req, res) => {
            try {
                const result = await servicesColl.find().toArray()
                res.send(result)
            } catch (error) {
                console.error('Error fetching services:', error);
                res.status(500).send({ message: 'Failed to fetch services', error: error.message });
            }
        })

        //for filter
        app.get('/filter-services', async (req, res) => {
            try {
                const min = parseInt(req.query.min);
                const max = parseInt(req.query.max);
                const query = {}
                if (min && !max) {
                    query.Price = { $gte: min }
                }
                else if (max && !min) {
                    query.Price = { $lte: max }
                }
                else if (min && max) {
                    query.Price = { $gte: min, $lte: max }
                }
                const result = await servicesColl.find(query).toArray();
                res.send(result)
            } catch (error) {
                console.error('Error filtering services:', error);
                res.status(500).send({ message: 'Failed to filter services', error: error.message });
            }
        })

        // get home services
        app.get('/services/home', async (req, res) => {
            try {
                const result = await servicesColl.find().sort({ created_at: -1 }).limit(5).toArray()
                res.send(result)
            } catch (error) {
                console.error('Error fetching home services:', error);
                res.status(500).send({ message: 'Failed to fetch home services', error: error.message });
            }
        })

        //get a single data 
        app.get('/services/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: 'Invalid service ID' });
                }
                const result = await servicesColl.findOne({ _id: new ObjectId(id) })
                if (!result) {
                    return res.status(404).send({ message: 'Service not found' });
                }
                res.send(result)
            } catch (error) {
                console.error('Error fetching service:', error);
                res.status(500).send({ message: 'Failed to fetch service', error: error.message });
            }
        })

        // all query service
        app.get('/my-services', verifyFBToken, async (req, res) => {
            try {
                const email = req.query.email;
                const query = {}
                if (email) {
                    if (email !== req.token_email) {
                        return res.status(403).send({ message: "forbidden access" })
                    }
                    query.Email = email;
                }
                const result = await servicesColl.find(query).sort({ created_at: -1 }).toArray();
                res.send(result)
            } catch (error) {
                console.error('Error fetching my services:', error);
                res.status(500).send({ message: 'Failed to fetch services', error: error.message });
            }
        })

        // add services 
        app.post('/services', verifyFBToken, validateService, async (req, res) => {
            try {
                const newServices = req.body;
                // Add timestamp and provider email
                newServices.created_at = new Date();
                newServices.Email = req.token_email;
                const result = await servicesColl.insertOne(newServices);
                res.send(result)
            } catch (error) {
                console.error('Error adding service:', error);
                res.status(500).send({ message: 'Failed to add service', error: error.message });
            }
        })

        //update a service
        app.patch('/services/:id', verifyFBToken, async (req, res) => {
            try {
                const id = req.params.id;
                const updateService = req.body;
                const update = { $set: updateService }
                const result = await servicesColl.updateOne({ _id: new ObjectId(id) }, update);
                res.send(result);
            } catch (error) {
                console.error('Error updating service:', error);
                res.status(500).send({ message: 'Failed to update service', error: error.message });
            }
        })

        //delete a service
        app.delete('/services/:id', verifyFBToken, async (req, res) => {
            try {
                const id = req.params.id;
                const result = await servicesColl.deleteOne({ _id: new ObjectId(id) })
                res.send(result)
            } catch (error) {
                console.error('Error deleting service:', error);
                res.status(500).send({ message: 'Failed to delete service', error: error.message });
            }
        })

        //post booking services
        app.post('/bookings', verifyFBToken, validateBooking, async (req, res) => {
            try {
                const newBooking = req.body;
                // Add timestamp, default status, and customer email from token
                newBooking.created_at = new Date();
                newBooking.status = newBooking.status || 'pending';
                newBooking.Email = req.token_email; // Ensure booking is tied to authenticated user
                const result = await bookingColl.insertOne(newBooking)
                res.send(result)
            } catch (error) {
                console.error('Error creating booking:', error);
                res.status(500).send({ message: 'Failed to create booking', error: error.message });
            }
        })

        //get bookings query 
        app.get("/my-bookings", verifyFBToken, async (req, res) => {
            try {
                const email = req.query.email;
                const query = {}
                if (email) {
                    if (email !== req.token_email) {
                        return res.status(403).send({ message: "forbidden access" })
                    }
                    query.Email = email;
                }
                const result = await bookingColl.find(query).sort({ created_at: -1 }).toArray();
                res.send(result)
            } catch (error) {
                console.error('Error fetching my bookings:', error);
                res.status(500).send({ message: 'Failed to fetch bookings', error: error.message });
            }
        })

        //delete booking
        app.delete('/booking/:id', verifyFBToken, async (req, res) => {
            try {
                const id = req.params.id;
                const result = await bookingColl.deleteOne({ _id: new ObjectId(id) })
                res.send(result)
            } catch (error) {
                console.error('Error deleting booking:', error);
                res.status(500).send({ message: 'Failed to delete booking', error: error.message });
            }
        })

        //add review 
        app.patch('/services/reviews/:id', verifyFBToken, validateReview, async (req, res) => {
            try {
                const id = req.params.id;
                const review = req.body;
                // Add timestamp and reviewer email to review
                review.created_at = new Date();
                review.reviewerEmail = req.token_email;
                const query = { _id: new ObjectId(id) }
                const update = { $push: { serviceReviews: review } }
                const result = await servicesColl.updateOne(query, update);
                res.send(result)
            } catch (error) {
                console.error('Error adding review:', error);
                res.status(500).send({ message: 'Failed to add review', error: error.message });
            }
        })


        // testimonials 
        app.get('/testimonials', async (req, res) => {
            try {
                const result = await servicesColl.find().project({ serviceReviews: 1 }).toArray()
                res.send(result)
            } catch (error) {
                console.error('Error fetching testimonials:', error);
                res.status(500).send({ message: 'Failed to fetch testimonials', error: error.message });
            }
        })

        // Health check endpoint
        app.get('/api/test', async (req, res) => {
            try {
                // Test database connection
                await client.db("admin").command({ ping: 1 });
                res.status(200).send({
                    message: 'Server and database connection successful',
                    timestamp: new Date().toISOString(),
                    database: 'Connected',
                    firebase: 'Initialized'
                });
            } catch (error) {
                res.status(500).send({
                    message: 'Database connection failed',
                    error: error.message
                });
            }
        })
        // Get service statistics (for dashboard)
        app.get('/stats', verifyFBToken, async (req, res) => {
            try {
                const totalServices = await servicesColl.countDocuments();
                const totalBookings = await bookingColl.countDocuments();
                const totalUsers = await usersColl.countDocuments();

                const recentServices = await servicesColl.find().sort({ created_at: -1 }).limit(5).toArray();
                const recentBookings = await bookingColl.find().sort({ created_at: -1 }).limit(5).toArray();

                res.send({
                    totalServices,
                    totalBookings,
                    totalUsers,
                    recentServices,
                    recentBookings
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                res.status(500).send({ message: 'Failed to fetch statistics', error: error.message });
            }
        })

        // Update booking status
        app.patch('/bookings/:id', verifyFBToken, async (req, res) => {
            try {
                const id = req.params.id;
                const { status } = req.body;
                const update = { $set: { status, updated_at: new Date() } }
                const result = await bookingColl.updateOne({ _id: new ObjectId(id) }, update);
                res.send(result);
            } catch (error) {
                console.error('Error updating booking status:', error);
                res.status(500).send({ message: 'Failed to update booking status', error: error.message });
            }
        })

        // Get all bookings (for admin)
        app.get('/all-bookings', verifyFBToken, async (req, res) => {
            try {
                const userEmail = req.token_email;
                const user = await usersColl.findOne({ userEmail });

                if (!user || user.role !== 'admin') {
                    return res.status(403).send({ message: 'Admin access required' });
                }

                const result = await bookingColl.find().sort({ created_at: -1 }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching all bookings:', error);
                res.status(500).send({ message: 'Failed to fetch bookings', error: error.message });
            }
        })

        // Get all users (for admin)
        app.get('/all-users', verifyFBToken, async (req, res) => {
            try {
                const userEmail = req.token_email;
                const user = await usersColl.findOne({ userEmail });

                if (!user || user.role !== 'admin') {
                    return res.status(403).send({ message: 'Admin access required' });
                }

                const result = await usersColl.find().sort({ _id: -1 }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching all users:', error);
                res.status(500).send({ message: 'Failed to fetch users', error: error.message });
            }
        })

        // Update user role (for admin)
        app.patch('/users/:id/role', verifyFBToken, async (req, res) => {
            try {
                const userEmail = req.token_email;
                const adminUser = await usersColl.findOne({ userEmail });

                if (!adminUser || adminUser.role !== 'admin') {
                    return res.status(403).send({ message: 'Admin access required' });
                }

                const id = req.params.id;
                const { role } = req.body;
                const update = { $set: { role, updated_at: new Date() } }
                const result = await usersColl.updateOne({ _id: new ObjectId(id) }, update);
                res.send(result);
            } catch (error) {
                console.error('Error updating user role:', error);
                res.status(500).send({ message: 'Failed to update user role', error: error.message });
            }
        })


        // </---------apis here--------->

        // Global error handler
        app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            res.status(500).send({
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });

        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).send({
                message: 'Route not found',
                path: req.originalUrl
            });
        });
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish

    }
}
run().catch(console.dir);
// </-------mongodb------->




app.get('/', (req, res) => {
    res.send({
        message: 'Home Hero Server is running!',
        status: 'active',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    })
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
