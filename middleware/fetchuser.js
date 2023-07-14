const jwt=require('jsonwebtoken');
const JWT_SECRET="MY name is @mit";

var ls = require('local-storage');

const fetchuser = (req, res, next) =>{
    //get the user from jwt token and add id to req object\
    const token=req.header('token');
    // const token=ls.get("token");
    console.log(token);
   
    if(!token) 
    {
        res.status(401).send({error: "token not found"});
    }
    try{
        const data =jwt.verify(token,JWT_SECRET);
        req.user=data.user;
       next();
    }catch(error){
        res.status(401).send({error: "some error occured"});
    }
}
module.exports = fetchuser;