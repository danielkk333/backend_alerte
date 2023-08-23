const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
  },
  nom: {
    type: String,
  },
  prenom: {
    type: String,
  },
  tel: {
    type: String,
  },
  adresse: {
    type: String,
  },
  contact_proche:{
    type:String
  },
  storedDate:{
    type:String
  },
  password:{
    type:String
  }
});

module.exports = mongoose.model("User", userSchema);
