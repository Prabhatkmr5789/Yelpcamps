var mongoose   =   require("mongoose");
var passportlomo =  require("passport-local-mongoose");

var userschema =  new mongoose.Schema({
            username:String,
            password:String,
            email:String
});

userschema.plugin(passportlomo);

module.exports  =   mongoose.model("User",userschema);