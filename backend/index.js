require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
// const multer = require('multer');

const authRoute = require('./routes/auth.route');
const feedRoute = require('./routes/feed.route');

const app = express();

//Parser
// app.use(multer().single('image'));
app.use(express.urlencoded({ extended: true })); //x-www-form-urlencoded
app.use(express.json()); //application/json

//Serving images statically
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')))

//Routes
app.use('/api/auth', authRoute);
app.use('/api/feed', feedRoute);

//Catch-All-Error-Middleware
app.use((error, req, res, next) => {
    const { message, data } = error;
    const status = error.statusCode || 500;
    res.status(status).json({ message, data});
});

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => console.log(`Server connect to port: ${PORT}`))
    })
    .catch(err => console.log(err))