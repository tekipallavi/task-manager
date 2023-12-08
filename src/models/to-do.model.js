// create Task Model

const mongoose = require("mongoose");


const Task = new mongoose.Schema({
    task: {
        type: String,
        required: true,
        trim: true
    }, 
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        default: 'Gray'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // ref here is the reference to the user object in the 'User' model, which links author to that user object
        // use Task.populate('author').execPopulate() to get the complete user object with the id in autor key
        ref: 'User'
    }
}, {
    timestamps: true
})

module.exports = {TaskModel: mongoose.model('Task', Task), taskFields: ['task', 'completed']};