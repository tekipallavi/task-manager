const express = require('express');
const { UserModel, userFields } = require('../models/user.model');
const aunthenticationRouterHOF = require('../routers/authenticationRouter');
const bcrypt = require('bcrypt');
const jwtToken = require('jsonwebtoken');
const router = new express.Router();
const multer = require('multer');



// create user route


// get users route
router.get('/users/getUsers', async (req, res) => {
    try {
        if(req.user.isSuperAdmin) {
            const users = await UserModel.find({});
            res.status(200).send(users);
        } else {
            throw new Error('Unauthorized access');
        }
    } catch (e) {
        console.log('------------', e);
        res.status(403).send(e);
    }
});

// Profile route

router.get('/users/getUsers/me', async (req, res) => {
    res.send(req.user);
});

// get user by Id route
router.get('/users/getUsers/:id', async (req, res) => {

    try {
        if(req.user.isSuperAdmin) {
            const user = await UserModel.findById(req.params.id);
            if(!user) {
                res.status(404).send('User not found');
            } else {
                res.status(200).send(user);
            }
        } else {
            throw new Error('Unauthorized access');
        }
    } catch (e) {
        res.status(500).send(e);
    }
});


// update own profile
/* Request Schema
{
    "name": "Teki Pallavi",
    "email": "tekipallavi@gmail.com",
    "password": "pwd1234"
}
*/
router.post('/users/updateUser/me', async (req, res) => {
    const hashPassword = pwd => bcrypt.hashSync(pwd, 8);


    const checkPrevPwd = async (id, pwd) => {
        const userInfo = await UserModel.findById(id);
        if(bcrypt.compareSync(pwd, userInfo.password)) {
            res.status(500).send('Password same as the last password!!!');
        }
    }

    const isValid = Object.keys(req.body).every(key => userFields.includes(key));
    if(!isValid) {
        res.status(400).send('Invalid fields in request');
        return;
    }

    try {

            let updateData = {...req.body};
    
            if(req.body.hasOwnProperty('password')) {
                checkPrevPwd(req.params.id, updateData.password);
                // Hashing pwd is done in Schema
                //updateData = {...updateData, password: hashPassword(updateData.password)}
            }

            if(updateData.hasOwnProperty('isSuperAdmin')) {
                delete updateData.isSuperAdmin;
            }
    
            //findByIdAndUpdate doesn't run the pre, post functions in schema so using findById
            let user = req.user;
            user = Object.assign(user, req.body);
            //Object.keys(req.body).forEach(key => {user[key] = req.body[key]})
            await user.save();
    
            //const user = await UserModel.findByIdAndUpdate(req.params.id, req.body,  {new: true, runValidators: true});
    
            if(!user) {
                res.status(404).send('User not found');
                return;
            } else {
                res.status(200).send(user);
                return;
            }
       
    } catch (e) {
        if(e.kind === 'ObjectId') res.status(404).send('Invalid User Id. User Not Found.');
        res.status(400).send(e);
    }
});

//configure multer for profile image

const uploadImg = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            cb(new Error('Upload a file with valid Image extension'), false);
        }
        cb(undefined, true);
    }
});

// upload profile image
/* Request Schema

{
    profileImg: <image binary data>
}

*/
router.post('/users/me/uploadProfileImage', uploadImg.single('profileImg'), async (req,res) => {
    req.user.avatar =  req.file.buffer;
    await req.user.save()
    res.send();
}, ( error, req, res, next) => {
    res.status(400).send({error: error.message});
});

// delete own profile Image

router.delete('/users/me/deleteProfileImg', async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(500).send(e);
    }
})

// get own profile Image

router.get('/users/me/getProfileImg', (req, res) => {
    try {
        
        if(!req.user.avatar) {
            throw new Error('User has no profile Image');
        }
        res.set('Content-Type', 'image/jpg');
        res.send(req.user.avatar);
    } catch (error) {
        res.status(500).send(error.message);
    }
})

// get profile image by Id 
router.get('/users/:id/getProfileImg', async (req, res) => {
    try{
        if(req.user.isSuperAdmin) {

            const user = await UserModel.findById(req.params.id);
    
            if(!user) {
                throw new Error('User not found.');
            }
    
            if(!user.avatar) {
                throw new Error('User has no profile Image');
            }
    
            res.set('Content-Type','image/jpg');
            res.send(user.avatar);
        } else {
            throw new Error('Action forbidden');
        }
        
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// update user 
/* Request Schema

{
    "name": "Teki Pallavi",
    "email": "tekipallavi@gmail.com",
    "password": "pwd1234",
    isSuperAdmin: false
}

*/
router.post('/users/updateUser/:id', async (req, res) => {
    const hashPassword = pwd => bcrypt.hashSync(pwd, 8);


    const checkPrevPwd = async (id, pwd) => {
        const userInfo = await UserModel.findById(id);
        if(bcrypt.compareSync(pwd, userInfo.password)) {
            res.status(500).send('Password same as the last password!!!');
        }
    }

    const isValid = Object.keys(req.body).every(key => userFields.includes(key));
    if(!isValid) {
        res.status(400).send('Invalid fields in request');
        return;
    }

    try {
        if(req.user.isSuperAdmin) {

            let updateData = {...req.body};

    
            if(req.body.hasOwnProperty('password')) {
                checkPrevPwd(req.params.id, updateData.password);
                // Hashing pwd is done in Schema
                //updateData = {...updateData, password: hashPassword(updateData.password)}
            }
    
            //findByIdAndUpdate doesn't run the pre, post functions in schema so using findById
            let user = await UserModel.findById(req.params.id);
            user = Object.assign(user, req.body);
            //Object.keys(req.body).forEach(key => {user[key] = req.body[key]})
            await user.save();
    
            //const user = await UserModel.findByIdAndUpdate(req.params.id, req.body,  {new: true, runValidators: true});
    
            if(!user) {
                res.status(404).send('User not found');
                return;
            } else {
                res.status(200).send(user);
                return;
            }
        } else {
            res.status(403).send('Unathourized access');
        }
    } catch (e) {
        if(e.kind === 'ObjectId') res.status(404).send('Invalid User Id. User Not Found.');
        res.status(400).send(e);
    }
});

// delete own profile

router.delete('/users/deleteUser/me', async (req, res) => {
    try {
        await req.user.remove();
        res.send({user: req.user, status: 'Delete Successful'});
    } catch (error) {
        res.status(500).send(error);
    }
});

// delete user

router.delete('/users/deleteUser/:id', async (req, res) => {
    try {
        if(req.user.isSuperAdmin) {
            const userToDelete = await UserModel.findById(req.params.id);
            if(!userToDelete) {
                res.status(404).send('User not found with this Id');
                return;
            }

            await userToDelete.remove();
    
            res.status(200).send(userToDelete);
        } else {
            res.status(403).send('User not authorized for this action.')
        }
    } catch(e) {
        res.status(500).send('Something went wrong. Please try again.')
    }
})

module.exports = aunthenticationRouterHOF(router);