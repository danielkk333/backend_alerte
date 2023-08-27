const env = require("dotenv");
env.config();
const mongoose = require("mongoose");

const Data = require("./models/data");

const User = require("./models/user");

const cors = require("cors");

const axios = require("axios");

const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");

var account = process.env.ACCOUNT;
var auth = process.env.AUTH;

const express = require("express");
const twilio = require("twilio")(account, auth);

const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors({}));

let mSocket;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

app.post("/sendSm", async (req, res) => {
  const { message, nom, prenom, tel, adresse } = req.body;
  const data = `je suis en danger, je reponds au de nom de ${nom} ${prenom}, mon numero de telephone est ${tel}, mon adresse est ${adresse}, et ma localisation est ${message}.`;

  // twilio.messages
  //   .create({
  //     from: "+14706348154",
  //     to: "+243827103485",
  //     body: data,
  //   })
  //   .then((result) => console.log("message was sent"))
  //   .catch((error) => console.error(error));

    // Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "mail56.lwspanel.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "infodemo@sunrise-drc.com", // generated ethereal user
        pass: "Alerte2023@", 
      }
});  

// Define the email options
const mailOptions = {
  from: 'infodemo@sunrise-drc.com',
  to: 'danielkalenga123@gmail.com',
  subject: 'Alerte, personne en danger',
  text: data
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
})

  res.json("good");
});

app.post("/checkData", async (req, res) => {
  const { id } = req.body;

  const user = await User.findOne({ _id: id });
  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post("/register", async (req, res) => {
  const { nom, prenom, tel, adresse,contact_proche,password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(req.body.password, salt);
  const telephone = await User.findOne({tel:tel})
  if(!telephone){
    try {
    const user = new User({
      nom,
      prenom,
      tel,
      adresse,
      contact_proche,
      password:hashedPass
    })
      .save()
      .then((myuser) => res.json({ myuser, success: true }))
      .catch((err) => console.log("error " + err));
  } catch (err) {
    res.json({ success: false, error:"une erreur s'est produite" });
    console.log(err);
  }
}else{
  res.json({success:false, error:'Ce numero de telephone est deja enregistre'})
}
  
});

//LOGIN
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ tel: req.body.tel });

    if (!user) {
      res.json({success:false,error :'Identifiants incorrects'})
    } 
    else {
    const validated = await bcrypt.compare(req.body.password, user.password);
      if(!validated){
        res.json({success:false,error :'Identifiants incorrects'})
      }else{
        const {password, ...others} = user
        res.json({success:true, user: others})
      } 
    }
  } catch (err) {
    res.json({success:false, error :'Connection impossible' })
    console.log(err)
    console.log(req.body)

  }
});

app.post("/postData", async (req, res) => {
  const { latitude, longitude, userId } = req.body;
  try {
    const data = new Data({
      latitude,
      longitude,
      userId,
    })
      .save()
      .then((data) => res.json(data))
      .catch((err) => console.log("error " + err));
  } catch (err) {
    console.log(err);
  }
});

app.get("/allUser", async (req, res) => {
  try {
    const user = await User.find();
    res.send(user);
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

app.get("/localisation/:id", async (req, res) => {
  const { id } = req.params;
  console.log('localisation');
  const data = await Data.findOne({ userId: id });
  const user = await User.findOne({ _id: id });
  console.log('the location is '+data)

  if (data) {
    res.json({ data, user, success: true });
    return;
  }
  res.json({ success: false });
});

//storedDate into database

app.post('/storedDate', async(req,res)=>{
  const { storedDate,id } = req.body
  const user = await User.findOne({_id:id})

  if(storedDate){
    user.storedDate = storedDate
    user
    .save()
    .then(() => res.json({success:true}))
    .catch((err) => res.json({success:false,error:err}))
  }else{
    console.log("error")
  }

})

app.get('/getStoreDate/:id', async(req,res)=>{
  const id = req.params.id
  console.log(id);

  const storedDate = await User.findOne({_id:id})
  if(storedDate.storedDate){
    res.json({success:true,storedDate:storedDate.storedDate})
  }else{
    res.json({success:false})
  }
})

app.post("/updateData", async (req, res) => {
  const { latitude, longitude, userId } = req.body;
  if (mSocket) {
    const user = await User.findOne({ _id: userId });
    mSocket.emit("user:move", JSON.stringify({ latitude, longitude, user }));
  }
  setTimeout(async () => {
    try {
      let data = await Data.findOne({ userId: userId });
      data.latitude = latitude;
      data.longitude = longitude;
      data.userId = userId
      data
        .save()
        .then((data) => res.json({data,success:true}))
        .catch((err) => console.log("error " + err));
    } catch (err) {
      console.log(err);
    }
  }, 5000);
});



const genToken = async () => {
  const result = await axios
    .post(
      "https://api.orange.com/oauth/v3/token",
      {
        grant_type: "client_credentials",
      },
      {
        headers: {
          Authorization: process.env.TOKEN_AUTH,
          Accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    )
    .then((res) => res.data);
  return result.access_token;
};

app.post("/sendSms", async function (req, res, next) {
  
  const token = await genToken();
  const devPhoneNumber = process.env.NUMBER_DEV;
  const recipient = 243810120658;
  const { message, nom, prenom, tel, adresse,contact_proche } = req.body;
  const data = `je suis en danger, je reponds au de nom de ${nom} ${prenom}, mon numero de telephone est ${tel}, mon adresse est ${adresse}, et ma localisation est ${message}.`;

  const transporter = nodemailer.createTransport({
    host: "mail56.lwspanel.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: "infodemo@sunrise-drc.com", // generated ethereal user
          pass: "Alerte2023@", 
        }
  });  
  
  // Define the email options
  const mailOptions = {
    from: 'infodemo@sunrise-drc.com',
    to: 'jokashongwe@gmail.com',
    subject: 'Alerte, personne en danger',
    text: data
  };
  
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  })

  await axios
    .post(
      `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${devPhoneNumber}/requests`,
      {
        outboundSMSMessageRequest: {
          address: `tel:+${recipient}`,
          senderAddress: `tel:+${devPhoneNumber}`,
          outboundSMSTextMessage: {
            message: data,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    )
    .then((result) => {
      res.json({success:true})
      console.log('sms envoye');
    })
    .catch((err) => {
      console.log(err);
    });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  mSocket = socket;
});

httpServer.listen(port, () => {
  console.log("the server is running on port " + port);
});
