const routesNotToValidate = ['/users/login', '/users/addUser'];
const jwtToken = require('jsonwebtoken');
const { UserModel, userFields } = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
    // only need to use if we have to check by our own, findOne will do this for us
    /* const checkForToken = async (user, token) => {
        const tokensArr = await user.tokens.toObject();
        return tokensArr.includes(activeToken =>  activeToken.token === token);
    } */

    try {
        if(!routesNotToValidate.includes(req.path)) {
            console.log("Route not to be validated", req.path);
            const token = req.headers.authorization.split(' ')[1];
            const {id, email} = jwtToken.verify(token, secret);
            const user = await UserModel.findOne({'_id': id, 'tokens.token': token});
            if(!user || !user.email === email) {
                res.status(401).send('Please authenticate.');
                return;
            }
            req.token = token;
            req.user = user;
            next();
        } else {
            console.log("Route to be validated", req.path, next);
            next();
        }

    } catch (e) {
        res.status(401).send(`Please authenticate. ${JSON.stringify(e)}`);
    }
}

module.exports = authMiddleware;