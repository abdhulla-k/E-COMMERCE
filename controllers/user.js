exports.getLogin = ( req, res, next ) => {
    res.render( "user/user-login.ejs", { user: false, admin: false });
}

exports.postLogin = ( req, res, next ) => {
    const userData = {
        username: req.body.username,
        password: req.body.password
    }
    console.log( userData );
    res.redirect( '/' );
}