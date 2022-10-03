const Product = require( "../models/product" );

exports.getAddProduct = ( req, res, next ) => {
    if( req.session.userLoggedIn ) {
        res.render( "seller/add-products", {
            user: req.session.userLoggedIn? "true" : "",
            userType: req.session.userType 
        });
    } else {
        res.redirect( "/" );
    }
}

exports.postAddProduct = ( req, res, next ) => {
    const product = Product({
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        category: req.body.category,
        user: req.session.userId,
    })

    console.log( product );

    product.save()
        .then( result => {

            // save image using express-fileuploader
            let image = req.files.image;
            image.mv( "./public/images/" + result.id + '.jpg', (err, done) => {
                if( !err ) {
                    res.redirect( '/' );
                } else {
                    console.log( err );
                }
            })
        })
        .catch( err => {
            console.log( err );
            res.redirect( "/" );
        })
}

exports.showMyProducts = ( req, res, next ) => {
    if( req.session.userLoggedIn ) {

        // get all products from database
        Product.find({ user: req.session.userId }, ( err, data ) => {
            res.render( "seller/my-products", { 
                products: data,
                user: req.session.userLoggedIn? "true" : "",
                userType: req.session.userType
            });
        })
    } else {
        res.redirect( "/" );
    }
}