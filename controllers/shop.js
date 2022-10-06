const Products = require("../models/product");

let filterKey;

exports.getShop = (req, res, next) => {
    res.render("user/home", {
        userType: "user",
        user: req.session.userLoggedIn ? "user" : ""
    });
}

exports.showAllProducts = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    if(req.session.filtering === true) {
        req.session.filtering = false;

        // send filtered products to shop
        Products.find({
            category: { $in: [
                filterKey.menDress,
                filterKey.womenDress,
                filterKey.kidsDress,
                filterKey.electronics,
                filterKey.mobiles,
                filterKey.vegitables
            ]}
        }, (err, data) => {
            if (data) {
                res.render("shop/shop", {
                    user: userStatus,
                    userType: userType,
                    products: data,
                    loginFrom: 'user'
                });
            } else {
                res.render("shop/shop", {
                    user: userStatus,
                    userType: userType,
                    products: [],
                    loginFrom: 'user'
                });
            }
        })
    } else {
        // send all products to shop
        Products.find({}, (err, data) => {
            if (data) {
                res.render("shop/shop", {
                    user: userStatus,
                    userType: userType,
                    products: data,
                    loginFrom: 'user'
                });
            } else {
                res.render("shop/shop", {
                    user: userStatus,
                    userType: userType,
                    products: [],
                    loginFrom: 'user'
                });
            }
        })
    }
}

exports.productDetails = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    const prodId = req.params.productId

    Products.findById(prodId)
        .then(product => {
            res.render("shop/detail", {
                user: userStatus,
                userType: "user",
                productDetails: product,
                userId: req.session.userId,
            });
        }).catch(err => {
            console.log(err);
            res.redirect( "/" );
        })
}

exports.filterProducts = (req, res, next) => {
    if (req.body.all) {
        req.session.filtering = false;
        console.log(false);
        res.redirect("showProducts");
    } else {
        req.session.filtering = true;

        filterKey = {
            menDress: req.body.menDress ? "Men dress" : "",
            womenDress: req.body.womenDress ? "Women dress" : "",
            kidsDress: req.body.kidsDress ? "Kids dress" : "",
            electronics: req.body.electronics ? "Electronics" : "",
            mobiles: req.body.mobiles ? "Mobiles" : "",
            vegitables: req.body.vegitables ? "Vegitables" : ""
        }
        res.redirect("showProducts");
    }
}