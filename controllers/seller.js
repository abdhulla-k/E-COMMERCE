const Product = require("../models/product");
const User = require("../models/user");
let filterKey;

// import bcryptjs third party module
const bcrypt = require("bcryptjs");

let loginErrorMessage;
let signupErrorMessage;

exports.getLogin = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        res.render("seller/seller-dashboard", {
            user: req.session.sellerLoggedIn ? "true" : "",
            userType: "seller",
        });
    } else {
        res.render("seller/seller-login", {
            user: "",
            errorMessage: loginErrorMessage,
            userType: "seller",
        });
        loginErrorMessage = "";
    }
}

exports.postLogin = (req, res, next) => {

    // optain the user entered data
    const loginData = {
        email: req.body.email,
        password: req.body.password
    }

    // check is user exist or not
    User.find({
        email: loginData.email
    }, (err, data) => {
        if (data.length > 0) {
            if (data[0].userType === 'seller') {
                // save user id to use other places
                req.session.sellerId = data[0].id

                // compare password if a user exist with the given email
                bcrypt.compare(
                    loginData.password,
                    data[0].password,
                    (err, isMatch) => {
                        if (err) {
                            throw err
                        } else if (!isMatch) {
                            console.log("password does not match");
                            loginErrorMessage = "wrong email or password";
                            res.redirect("/seller/");
                        } else {
                            req.session.sellerLoggedIn = true;
                            // console.log( req.session.userType );
                            res.redirect("/seller/");
                        }
                    }
                )
            } else {
                console.log("seller not exist");
                loginErrorMessage = "seller not exist!";
                res.redirect("/seller/");
            }
        } else {
            loginErrorMessage = "seller not exist!";
            res.redirect("/seller/");
        }
    })
}

exports.getSignup = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        res.redirect('/');
    } else {
        res.render("seller/seller-signup", {
            user: "",
            errorMessage: signupErrorMessage,
            userType: "seller",
        });
        signupErrorMessage = "";
    }
}

exports.postSignup = (req, res, next) => {
    // obtain all data user entered in signup form
    const signupData = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phone,
        userType: 'seller'
    }

    // set salt round to bcrypt the password
    const saltRound = 10;

    // check is it exist or not
    User.find({
        email: signupData.email
    }, (err, data) => {

        // save user if it is not exist in database
        if (data.length === 0) {

            // bcrypt the password
            bcrypt.genSalt(saltRound, (saltError, salt) => {
                if (saltError) {
                    throw saltError
                } else {
                    bcrypt.hash(signupData.password, salt, (hashError, hash) => {
                        if (hashError) {
                            throw hashError
                        } else {

                            // create User object or document
                            const user = new User({
                                name: signupData.name,
                                email: signupData.email,
                                phoneNumber: signupData.phoneNumber,
                                password: hash,
                                userType: signupData.userType
                            })

                            // save the user
                            user.save()
                                .then(result => {
                                    res.redirect("/seller/");
                                })
                                .catch(err => {
                                    console.log("error in user createion");
                                    console.log(err);
                                    res.redirect('/');
                                })
                        }
                    })
                }
            })
        } else {
            signupErrorMessage = "user already exist";
            console.log("emil exist");
            res.redirect("/seller/signup");
        }
    })
}

exports.getAddProduct = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        res.render("seller/add-products", {
            user: req.session.sellerLoggedIn ? "true" : "",
            userType: "seller",
            loginFrom: 'seller'
        });
    } else {
        res.redirect("/seller/");
    }
}

exports.postAddProduct = (req, res, next) => {
    const product = Product({
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        category: req.body.category,
        user: req.session.sellerId,
    })

    console.log(product);

    product.save()
        .then(result => {

            // save image using express-fileuploader
            let image = req.files.image;
            image.mv("./public/images/" + result.id + '.jpg', (err, done) => {
                if (!err) {
                    res.redirect('/seller/');
                } else {
                    console.log(err);
                }
            })
        })
        .catch(err => {
            console.log(err);
            res.redirect("/seller/");
        })
}

exports.showMyProducts = (req, res, next) => {
    if (req.session.sellerLoggedIn) {

        if (req.session.filtering === true) {
            req.session.filtering = false;
            Product.find({
                user: req.session.sellerId,
                category: {
                    $in: [
                        filterKey.menDress,
                        filterKey.womenDress,
                        filterKey.kidsDress,
                        filterKey.electronics,
                        filterKey.mobiles,
                        filterKey.vegitables
                    ]
                }
            }, (err, data) => {
                console.log(data);
                res.render("seller/my-products", {
                    products: data,
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "seller",
                    loginFrom: 'seller'
                });
            })
        } else {
            // get all products from database
            req.session.filtering = false;
            Product.find({
                user: req.session.sellerId
            }, (err, data) => {
                res.render("seller/my-products", {
                    products: data,
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "seller",
                    loginFrom: 'seller'
                });
            })
        }
    } else {
        res.redirect("/");
    }
}

exports.myProductDetails = (req, res, next) => {
    let userStatus = req.session.sellerLoggedIn ? "true" : "";

    const prodId = req.params.productId

    Product.findById(prodId)
        .then(product => {
            res.render("shop/detail", {
                user: "seller",
                userType: "seller",
                productDetails: product,
                userId: req.session.sellerId
            });
        }).catch(err => {
            console.log(err);
            res.redirect("/seller/");
        })
}

exports.filterProducts = (req, res, next) => {
    if (req.body.all) {
        req.session.filtering = false;
        console.log(false);
        res.redirect("showMyProducts");
    } else {
        req.session.filtering = true;

        filterKey = filterKey = {
            menDress: req.body.menDress ? "Men dress" : "",
            womenDress: req.body.womenDress ? "Women dress" : "",
            kidsDress: req.body.kidsDress ? "Kids dress" : "",
            electronics: req.body.electronics ? "Electronics" : "",
            mobiles: req.body.mobiles ? "Mobiles" : "",
            vegitables: req.body.vegitables ? "Vegitables" : ""
        }
        res.redirect("showMyProducts");
    }
}

exports.logout = (req, res, next) => {
    req.session.sellerLoggedIn = false;
    res.redirect("/seller/");
}