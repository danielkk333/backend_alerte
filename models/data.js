const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dataSchema = new mongoose.Schema({
  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  userId: {
    type: String,
  },
  
});

module.exports = mongoose.model("Datas", dataSchema);
