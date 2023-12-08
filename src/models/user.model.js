const mongoose = require('mongoose');
const validate = require('validator');
const { default: validator } = require('validator');
const bcrypt = require('bcrypt');
const jwtToken = require('jsonwebtoken');
const { string } = require('yargs');
const { TaskModel } = require('../models/to-do.model');

const userFields = ['name', 'email', 'password', 'isSuperAdmin'];
const userPublicFields = ['name', 'email'];

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        unique: true,
        trim: true,
        validate(value) {
            return validator.isEmail(value)
        }
    }, 
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            const length = val => val.length > 6;
            const conatinsString = val => !val.includes('password');

            const isValid = [length, conatinsString].every(fn => fn(value));

            if(!isValid) throw new Error('Validation Error')
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    isSuperAdmin: {
        type: Boolean,
        required: false,
        default: false
    }
}, {
    timestamps: true
});

// when writing schema.methods, they are attached to the instance and when a regular function is written , 
// the instance obj is actually present in this of the function  (like in toJSON).
// If an arrow fn is used, we need to fetch the user explicitly (like in generateToken).


//toJSON is called before the object is stringified (which is when we call res.send), so overwriting toJSON will allow us to expose only non-private fields.
userSchema.methods.toJSON = function() {
    let user = this;
    user = user.toObject();
    const userObjToExpose = {};
    userPublicFields.forEach(field => userObjToExpose[field] = user[field]);
    return userObjToExpose;
}

userSchema.methods.generateToken = async (email, pwd) => {
    const user = await User.findOne({email});
    const token = jwtToken.sign({id: user._id.toString(), email: user.email}, secret);
    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;

}

userSchema.statics.findByCredentials = async (email, pwd) => {
    const user = await User.findOne({email});

    if(!user) return {status: 400, msg:'Invalid Credentials'};

    const pwdMatch = bcrypt.compare(pwd, user.password);

    if(!pwdMatch) return {status: 400, msg:'Invalid Credentials'};

    return user;
};

//  Setting up a relation b/w user and tasks
// this tells that the user with _id is directly related to the Task in Task model whole author (foriegnField) is same as the _id (localField)
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'author'
})

userSchema.pre('save', async function(next) {
    const user = this;
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Delete all users tasks before removing the user
userSchema.pre('remove', async function(next) {
    const user = this;
    await TaskModel.deleteMany({author: user._id});
    next()
});

const User = mongoose.model('User', userSchema);

module.exports =  { UserModel: User, userFields};

