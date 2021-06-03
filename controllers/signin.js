var jwt = require('jsonwebtoken');
// Redis Setup
const redis = require('redis');

// You will want to update your host to the proper address in production
const redisClient = redis.createClient(process.env.REDIS_URI);




redisClient.on("error", function(error) {
  console.error(error);
});


const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    //return res.status(400).json("incorrect form submission");
    return Promise.reject('incorrect from submisssion');
  }
  return db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((user) => user[0])
          .catch((err) => Promise.reject("unable to get user"));
      } else {
        Promise.reject("wrong credentials");
      }
    })
    .catch((err) => Promise.reject("wrong credentials"));
};

const getAuthTokenId = (req,res) => {
  const {authorization} = req.headers;
  return redisClient.get(authorization, (err, reply)=> {
    if(err || !reply) {
      return res.status(400).json('Unauthorized');
    }
    return res.json({id:reply})
  })

};

const signToken = (email) => {
  const jwtPayload = {email};
  return jwt.sign(jwtPayload, 'JWT-SERECT', {expiresIn:'2 day'});
}

const setToken = (key, value) => Promise.resolve(redisClient.set(key, value));

const createSessions = (user) => {
  const { email, id } = user;
  const token = signToken(email);
  return setToken(token, id)
    .then(() => {
      return { success: 'true', userId: id, token, user }
    })
    .catch(console.log);
};



const signinAuthentication = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers;
  return authorization ? getAuthTokenId(req,res) : 
  handleSignin(db, bcrypt, req, res)
  .then(data => {
    return data.id && data.email ? createSessions(data) : Promise.reject(data)
  })
  .then(seeeion => res.json(seeeion))
  .catch(err => res.status(400).json(err))
};

module.exports = {
  handleSignin: handleSignin,
  signinAuthentication:signinAuthentication
};
