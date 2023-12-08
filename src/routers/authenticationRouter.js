
const { UserModel, userFields } = require('../models/user.model');

const addAutenticationRoutes  = router => {

    //Login route
        /* Request Schema
        {
            "email": "tekipallavi@gmail.com",
            "password": "pwd1234"
        }
        */
    router.post('/users/login', async (req, res) => {

        try{
            const user = await UserModel.findByCredentials(req.body.email, req.body.password);
            
            if(user.status) {
                res.status(user.status).send(user.msg);
                return;
            }

            console.log(user);

            if(user) {
                const token = await user.generateToken(req.body.email, req.body.password);
            }
            res.status(200).send({user, token});
        } catch (e) {
            res.status(500).send('Something went wrong!!! Try again.', JSON.stringify(e));
        }
    });

    //signup route
        /* Request Schema
        {
            "name": "Teki Pallavi",
            "email": "tekipallavi@gmail.com",
            "password": "pwd1234"
        }
        */
    router.post('/users/addUser', async (req, res) => {

        // this functionality is done internally by mongoose when we add unique: true to the schema
        /*const checkAndAdd = async () => {
             const {email} = req.body;
            const [user] = await UserModel.find({email});
            if(!user) {
                // Hashing pwd is done in Schema
                //const userData = {...req.body, password: hashPassword(req.body.password)}
                const saved = await new UserModel(req.body).save();
                return {status:200, msg: saved};
            } else {
                return {status: 400, msg:'User Already Exists'};
            }
        } */
        
       const userProfile = req.body;
       if(userProfile.hasOwnProperty('isSuperAdmin')) {
           delete userProfile.isSuperAdmin;
       }
        new UserModel(userProfile).save().then(async (user) => { 
            const token = await user.generateToken(req.body.email, req.body.password);
            res.status(201).send({user, token})
        }).catch(e => {
            if(e.keyValue && e.keyValue.email) {
                res.status(400).send('User Already Exists');
            } else {
                res.status(500).send(e)
            }
        });
    
    });

    //logout route 

    router.post('/logout', async (req, res) => {
        try {
            req.user.tokens = req.user.tokens.filter(token => {
                return token.token !== req.token;
            })

            await req.user.save();

            res.status(200).send('Log out success');
        } catch (e) {
            res.status(500),send('Something went wrong');
        }
    });

    //logout all sessions route 

    router.post('/logoutAll', async (req, res) => {
        try {
            req.user.tokens = [];
            await req.user.save();

            res.status(200).send('Logged out of all devices');
        } catch (e) {
            res.status(500),send('Something went wrong');
        }
    });

    return router;
}

module.exports = addAutenticationRoutes;