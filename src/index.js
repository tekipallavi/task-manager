global.print = console.log;
global.secret = 'thisismykey';
const express = require('express');
const cors = require('cors');
const yargs = require('yargs');
const { response } = require('express');
const userRouter = require('../src/routers/userRoutes');
const taskRouter = require('../src/routers/taskRoutes');
const auth = require('./middleware/auth');
require('./db/mongoose');

const app = express();

// setup cors
app.use(cors());

//setup middleware
app.use(auth);

// setup express to auto parse json body from incoming requests
app.use(express.json());

// Register routers for different routes
app.use(userRouter);
app.use(taskRouter);


// listen to port
app.listen(process.env.PORT || 3000, () => {
    print('port up');
});