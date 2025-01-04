require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const { userSchema } = require('./schema/userSchema');
const { exerciseSchema } = require('./schema/exerciseSchema');

// const { pingMongodb } = require('./pingMongoDb');
// ping deployment
// pingMongodb(process.env.MONGO_URI, { serverApi: { version: '1', strict: true, deprecationErrors: true } }).catch(console.error);

// connect DB
mongoose.connect(process.env.MONGO_URI, { serverApi: { version: '1', strict: true, deprecationErrors: true } });

// create MongoDB Models
const Exercises = mongoose.model('Exercises', exerciseSchema);
const Users = mongoose.model('Users', userSchema);

app.use(cors());

// provide public static files
app.use(express.static('public'));

// provide Homepage
app.get('/', (_, res) => res.sendFile(__dirname + '/views/index.html'));

// get all users
app.get('/api/users', (_, res) => Users.find({}).then((data) => res.json(data)).catch((err) => res.json({ Error: err })));

// create new user
app.post('/api/users', bodyParser.urlencoded({ extended: false }), (req, res) => {
    const newUser = new Users({ username: req.body.username });
    newUser.save().then((data) => {
        const result = { username: data.username, _id: data.id };
        res.json(result); 
    }).catch((err) => {
        console.error("[ERR]:", err);
        res.json({ Error: err });
    });
});

// create new exercise for user
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false }), (req, res) => {    
    const newExercise = new Exercises({ 
        description: req.body.description, 
        duration: parseInt(req.body.duration), 
        date: req.body.date === '' ? new Date().toISOString().substring(0, 10) : req.body.date
    });
    Users.findByIdAndUpdate(req.params._id, { $push: { log: newExercise } }, { new: true }).then((data) => {
        res.json({ 
            _id: data.id, 
            username: data.username, 
            date: new Date(newExercise.date).toDateString(),
            duration: newExercise.duration, 
            description: newExercise.description
        });
    }).catch((err) => {
        console.error("[ERR]:", err);
        res.json({ Error: err })
    });
});

// get all exercises for user filtered by query
app.get('/api/users/:_id/logs', (req, res) => {    
    Users.findById(req.params._id).then((data) => {
        let responseLog = data.log;
        
        // if from or to query present, filter exercises
        if (req.query.from || req.query.to) {
            fromDate = new Date(req.query.from).getTime() || new Date(0);
            toDate = new Date(req.query.to).getTime() || new Date();
            responseLog = responseLog.filter((exercise) => {
                const exerciseDate = new Date(exercise.date).getTime();
                return exerciseDate >= fromDate && exerciseDate <= toDate;
            });
        }

        // if limit query present, limit exercises
        if (req.query.limit) {
            responseLog = responseLog.slice(0, req.query.limit);
        }
        
        // strip away _id from DB and provide datestring
        responseLog = responseLog.map((exercise) => {
            const dateString = new Date(exercise.date).toDateString();
            return {
                description: exercise.description,
                duration: exercise.duration,
                date: dateString === 'Invalid Date' ? new Date().toDateString() : dateString
            };
        });
            
        res.json({ count: data.log.length, log: responseLog });               
    }).catch((err) => {
        console.error("[ERR]:", err);
        res.json({ Error: err })
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});