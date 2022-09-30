exports.getShop = ( req, res, next ) => {
    let userStatus = req.session.userLoggedIn? "true" : "";
    res.render( "user/home", { user: userStatus });
}