const env = require("dotenv");
env.config();
const mongoose = require("mongoose");

const Data = require('./models/data')

const User = require('./models/user')

const cors = require('cors')

var account = process.env.ACCOUNT
var auth = process.env.AUTH
console.log(auth)

const express = require('express')
const twilio = require('twilio')(account,auth)

const app = express()

app.use(cors({}))

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000

app.post('/sendSms', async(req,res)=>{
    const message = req.body.message
    console.log(message)
    const nom = req.body.nom
    const prenom = req.body.prenom
    const tel = req.body.tel
    const adresse = req.body.adresse
    const data = `je suis en danger, je reponds au de nom de ${nom} ${prenom}, mon numero de telephone est ${tel}, mon adresse est ${adresse}, et ma localisation est ${message}.`

    twilio.messages.create({
        from:'+14175413757',
        to:'+243827103485',
        body:data
    })
    .then((result)=>console.log('message was sent'))
    .catch(error => console.error(error));
    res.json('good')
})

app.post('/checkData', async (req,res)=>{
  const {id } = req.body

  const user = await User.findOne({_id:id})
  if(user){
    res.json({success:true})
  }else{
    res.json({success:false})
  }
})

app.post('/register', async (req,res)=>{
    const {nom , prenom, tel, adresse } = req.body
    try{
      const user = new User({
        nom , prenom, tel, adresse
    }).save()
    .then((myuser) => res.json({myuser,success:true}))
    .catch((err) => console.log('error '+ err)) 
}catch(err){
    res.json({user,success:false})
    console.log(err)
}
})

app.post('/postData', async(req,res)=>{
    const {latitude , longitude,userId } = req.body
    try{
      const data = new Data({
        latitude,longitude,userId
    }).save()
    .then((data) => res.json(data))
    .catch((err) => console.log('error '+ err)) 
}catch(err){
    console.log(err)
}
    
})

app.post('/updateData', async(req,res)=>{
    const {latitude , longitude,id } = req.body
   try{

      await Data.updateOne(
    { _id: id },
    {
      $set: { latitude, longitude },
    },
    { new: true }
  )
    .then(() => {
      console.log('updated successfully')
    })
    .catch((err) => {
      console.log(err);
    });
    res.json({success:true})

}catch(err){
    console.log(err);
    res.json({success:false})
}
})

app.get('/allUser', async(req,res)=>{
    try{

        const user = await User.find()
        res.send(user)

    }catch(err){
     console.log(err)
      res.json({success:false})
    }
})

app.get('/localisation/:id', async(req,res)=>{
    const id = req.params.id 

    const data = await Data.findOne({userId:id})

    if(data){
        res.json({data,success:true})
        return
    }
    res.json({success:false})
})

app.listen(port, () => {
    console.log("the server is running on port " + port);
  });