const Products = require("../models/product");
const Category = require("../models/product_category");
const Banner = require("../models/banner");

let filterKey = [];
let categories;

exports.getShop = (req, res, next) => {
    let products = [];
    if (categories) {
        Products.find({}).limit(4).then(data => {
                products = data
                return Banner.find({})
            })
            .then(banners => {
                if (banners) {
                    res.render("user/home", {
                        userType: "user",
                        user: req.session.userLoggedIn ? "user" : "",
                        categories: categories,
                        latestProducts: products,
                        banners: banners
                    })
                } else {
                    res.render("user/home", {
                        userType: "user",
                        user: req.session.userLoggedIn ? "user" : "",
                        categories: categories,
                        latestProducts: products,
                        banners: []
                    })
                }
            })
            .catch(err => {
                console.log(err);
                res.render("user/home", {
                    userType: "user",
                    user: req.session.userLoggedIn ? "user" : "",
                    categories: categories,
                    latestProducts: products ? products : [],
                    banners: banners ? banners : []
                })
            })
    } else {
        Category.find({}, (err, data) => {
            if (data) {
                categories = data;
                res.redirect('/')
            }
        })
    }
}

exports.showAllProducts = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    if (categories) {
        if (req.session.filtering === true) {
            req.session.filtering = false;

            // send filtered products to shop
            Products.find({
                category: {
                    $in: [
                        ...filterKey
                    ]
                }
            }, (err, data) => {
                if (data) {
                    res.render("shop/shop", {
                        user: userStatus,
                        userType: userType,
                        products: data,
                        categories: categories
                    });
                } else {
                    noProductsAvailable();
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
                        categories: categories
                    });
                } else {
                    noProductsAvailable();
                }
            })
        }
    } else {
        // find categories if it is empty
        Category.find({}, (err, data) => {
            if (data) {
                categories = data;
                res.redirect('/showProducts')
            }
        })
    }

    // to render with no products
    function noProductsAvailable() {
        res.render("shop/shop", {
            user: userStatus,
            userType: userType,
            products: [],
            categories: categories
        });
    }
}

exports.productDetails = (req, res, next) => {
    let userStatus = req.session.userLoggedIn ? "true" : "";
    let userType = req.session.userType; // seller or user

    const prodId = req.params.productId

    Category.find({})
        .then(data => {
            categories = data;
            return Products.findById(prodId)
        })
        .then(product => {
            console.log(product)
            res.render("shop/detail", {
                user: userStatus,
                userType: "user",
                productDetails: product,
                categories: categories,
                userId: req.session.userId,
            });
        }).catch(err => {
            console.log(err);
            res.redirect("/");
        })
}

exports.filterProducts = (req, res, next) => {
    filterKey = [];
    if (req.body.all) {
        req.session.filtering = false;
        res.redirect("showProducts");
    } else {
        req.session.filtering = true;

        // get categories to filter
        for (category of categories) {
            let key = category.categoryName;
            if (req.body[key]) {
                filterKey.push(category.id);
            }
        }
        // console.log(req.body)
        res.redirect("showProducts");
    }
}