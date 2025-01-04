const mongoose = require('mongoose');
const { exerciseSchema } = require('./exerciseSchema')

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    log: [ exerciseSchema ]
});

module.exports = { userSchema };