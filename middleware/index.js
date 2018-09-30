var Comment   =   require("../models/comment");
var obj={};

obj.isloggedin  =   function(req,res,next){
         if(req.isAuthenticated()){
             return next();
         }
         req.flash("error","you are not login");
         res.redirect("/login");
    
};

obj.ownprofile =  function(req,res,next){
         if(req.isAuthenticated()){
             Comment.findById(req.params.comments_id , function(err,comm){
                 if(err){
                     console.log(err);
                 }else{
                     if(comm.author.id.equals(req.user._id)){
                         return next();
                     }
                     else{
                         res.redirect("back")
                     }
                 }
             })
         }
      else{
          res.redirect("back");
      }
}

module.exports   =   obj;