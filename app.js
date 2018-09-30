var express     =      require("express"),
    mongoose    =      require("mongoose"),
    bodyparser  =      require("body-parser"),
    methodover  =      require("method-override"),
    flash       =      require("connect-flash"),
    passport    =      require("passport"),
    passportlo  =      require("passport-local"),
    middleware  =      require("./middleware"),
    User        =      require("./models/user"),
    Campground  =      require("./models/campground"),
    Comment     =      require("./models/comment"),
    multer      =      require("multer"),            // package of image upload 
    cloudinary  =      require("cloudinary"),       // package of image upload 
    app         =      express();
    
mongoose.connect("mongodb://prabhat:prabhat123@ds115543.mlab.com:15543/yelpcamps");

app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));
app.use(methodover("_method"));


app.set("view engine","ejs");


app.use(require("express-session")({
    secret:"hey body",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(new passportlo(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.current_user = req.user;                // for current_user variable can use any routes
    res.locals.error= req.flash("error");
    res.locals.success=req.flash("info");
    next();                                        
})





//======================
// Image Upload
//======================

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


//    Index Route

app.get("/",function(req,res){
    res.render("land");
})
function escaperegex(text){
    
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

app.get("/campgrounds",function(req,res){
      
      if(req.query.fuzzy)
      {
          const regex = new RegExp(escaperegex(req.query.fuzzy),"gi");
          Campground.find({"name":regex},function(err,camp){
              if(err){
                  console.log(err);
              }else{
                  res.render("campground/Index",{camp:camp});
              }
          })
      }
      
       Campground.find({},function(err,camp){
           if(err){
               console.log(err);
           }else{
               res.render("campground/Index",{camp:camp});
           }
       });
});

// New Routes 

app.get("/campgrounds/new",function(req,res){
         res.render("campground/new");
      });
      
// Post Routes

app.post("/campgrounds",middleware.isloggedin,upload.single("image"),function(req,res){
    cloudinary.uploader.upload(req.file.path ,function(result){
        req.body.camp.image = result.secure_url;
        req.body.camp.author={
               id:req.user._id,
               username:req.user.username
        }
        Campground.create(req.body.camp,function(err,campground){
                   if(err){
                       console.log(err);
                   }else{
                       res.redirect("/campgrounds");
                   }
         });
        
    })
         
      });
      
// Show Routes

app.get("/campgrounds/:id",function(req,res){
         Campground.findById(req.params.id).populate("comments").exec(function(err,yelp){
                   if(err){
                       console.log(err);
                   }else{
                       res.render("campground/show",{camp:yelp});
                   }
         });
});

// Edit Routes

app.get("/campgrounds/:id/edit",function(req,res){
    Campground.findById(req.params.id,function(err,campground){
              if(err){
                  console.log(err);
              }else{
                  res.render("campground/edit",{campground:campground});
              }
    })
})

// Update

app.put("/campgrounds/:id",function(req,res){
    Campground.findByIdAndUpdate(req.params.id, req.body.camp, function(err,campground){
                if(err){
                    console.log(err);
                }else{
                    res.redirect("/campgrounds/"+ req.params.id);
                }
    });
});

// DELETE

app.delete("/campgrounds/:id",function(req,res){
       Campground.findByIdAndRemove(req.params.id, function(err,campi){
                 if(err){
                     console.log(err);
                 }else{
                     res.redirect("/campgrounds");
                 }
       });
});

// ===============================
// COMMENTS
// ===============================

app.get("/campgrounds/:id/comment/new",middleware.isloggedin ,function(req,res){
    Campground.findById(req.params.id, function(err,campground){
               if(err){
                   console.log(err);
               }else{
                   res.render("comment/new",{campground:campground});
               }
    });
});

app.post("/campgrounds/:id/comment" ,function(req,res){
         Comment.create(req.body.camp, function(err,yelp){
             if(err){
                 res.redirect("/campgrounds");
             }else{
                 Campground.findById(req.params.id, function(err,campground){
                        if(err){
                            console.log(err);
                        }else{
                            
                             yelp.author.id = req.user._id;
                             yelp.author.username=req.user.username;
                             yelp.save();
                            campground.comments.push(yelp);
                            campground.save();
                            req.flash("info","Your comment has created")
                            res.redirect("/campgrounds/"+campground._id);
                        }
                 })
             }
         })
})

// Edit Routes

app.get("/campgrounds/:id/comments/:comments_id/edit",middleware.ownprofile,function(req,res){
 Comment.findById(req.params.comments_id ,function(err,comment){
           if(err){
               console.log(err);
           }else{
               Campground.findById(req.params.id , function(err,campground){
                        if(err){
                            console.log(err);
                        }else{
                             
                                   res.render("comment/edit",{campground:campground , comment:comment});             
                        }
               })
              
           }
 })
    
})

// Update Routes

app.put("/campgrounds/:id/comments/:comments_id",function(req,res){
     Comment.findByIdAndUpdate(req.params.comments_id ,req.body.Text, function(err,comment){
           if(err){
               console.log(err);
           }else{
               req.flash("info","Your comment has updated !")
               res.redirect("/campgrounds/"+req.params.id);
           }
     })
})

//Delete Routes

app.delete("/campgrounds/:id/comments/:comments_id",middleware.ownprofile,function(req,res){
    
    Comment.findByIdAndRemove(req.params.comments_id , function(err,comment){
                     if(err){
                         console.log(err);
                     }else{
                         req.flash("info","Your comment has been successful deleted");
                         res.redirect("/campgrounds/"+req.params.id);
                     }
        
    })
})




// ==============================
// Authentication
// ============================

app.get("/register",function(req,res){
        res.render("register");
});

app.post("/register",function(req,res){
    var newuser= User({username:req.body.username,
                email:req.body.email
    });
    User.register( newuser, req.body.password ,function(err,hello){
                         if(err){
                         
                             
                             req.flash("error", err.message)
                             return res.render("register");
                         }else{
                             passport.authenticate("local")(req,res,function(){
                                 req.flash("info","Thanku for signup" + " "+ hello.username)
                                 res.redirect("/campgrounds");
                             });
                         }
    });
});
app.get("/login",function(req,res){
    console.log(req.user);
    res.render("login");
})
app.post("/login",passport.authenticate("local",{
            successRedirect:"/campgrounds",
            failureRedirect:"/register"
}) , function(req,res){
    
});

app.get("/logout",function(req,res){
        req.logout();
      req.flash("info","you Logged out");
        res.redirect("/campgrounds");
      
        
});




//======================
// Image Upload
//======================

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



app.listen(process.env.PORT,process.env.IP);