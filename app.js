const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes');
const mobileRoutes = require('./routes/mobile');
const authRoutes = require('./routes/auth.route');
const { jwtMiddleware } = require('./middlewares/auth');

const app = express();

const corsOptions= {
    origin: '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
};

app.use('/uploads/', express.static(__dirname + '/public/uploads'));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/mobile', mobileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', jwtMiddleware, apiRoutes);

module.exports = app;

