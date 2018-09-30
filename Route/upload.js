var express = require("express"),
 multer =  require("multer"),
 cloudinary =  require("cloudinary"),
   route    = express.Router();
   
   
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})


cloudinary.config({ 
  cloud_name: 'tailer', 
  api_key: '973925748676287', 
  api_secret:'CVtBqk-dxZ5rexL7ThR1fLnVBQk'
});

module.exports =  route;
   
    