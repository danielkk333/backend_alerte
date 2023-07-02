var account = 'AC12e0f6f1ad4dc9325dd2cfa4e018c4ba'
var auth = '03578eed33466a67e23cc1f432341c19'


const express = require('express')
const twilio = require('twilio')(account,auth)

const app = express()

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000

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

app.listen(port, () => {
    console.log("the server is running on port " + port);
  });