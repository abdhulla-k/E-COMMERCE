const Products = require("../models/product");

exports.getShop = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    res.render("user/home", {
        user: userStatus,
        userType: userType
    });
}

exports.showAllProducts = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    Products.find({}, (err, data) => {
        if (data) {
            res.render("shop/shop", {
                user: userStatus,
                userType: userType,
                products: data
            });
        } else {
            res.render("shop/shop", {
                user: userStatus,
                userType: userType,
                products: []
            });
        }
    })
}

exports.productDetails = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    const prodId = req.params.productId

    Products.findById(prodId)
        .then(product => {
            res.render("shop/detail", {
                user: userStatus,
                userType: userType,
                productDetails: product
            });
        }).catch(err => {
            console.log(err);
            res.redirect( "/" );
        })
}