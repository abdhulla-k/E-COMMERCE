exports.getShop = ( req, res, next ) => {
    let userStatus = req.session.userLoggedIn? "true" : "";
    let userType = req.session.userType; // seller or user

    res.render( "user/home", { user: userStatus, userType: userType });
}