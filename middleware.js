
module.exports.isLoggedIn = (req ,res ,next) =>{
    if(!req.cookies.user){
        return res.redirect('/auth/signin');
    }
    next();
};



