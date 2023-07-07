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
  }
  
});

module.exports = mongoose.model("User", userSchema);
