const { MODERATION_MODEL } = require('clarifai');

const redisClient = require('./signin').redisClient;

const requireAuth = (req, res, next) => {
    const {authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json('Unauthoized');

    }
    return redisClient.get(authorization,(err, reply) =>{
        if (err || !reply){
            return res.status(401).json('Unauthorzed');
        }
        console.log('you shall pass');
        return next();
    })
    
}

module.exports = {
    requireAuth :requireAuth
}