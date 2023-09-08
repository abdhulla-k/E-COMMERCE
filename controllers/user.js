const fs = require('fs');

const User = require("../models/user");
const Categories = require("../models/product_category");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Order = require("../models/orders");
const Coupon = require("../models/coupon");
const Wishlist = require("../models/watch-list");

// import bcryptjs third party module
const bcrypt = require("bcryptjs");
// import razore pay
const Razorpay = require("razorpay");
// import mongoose
const mongoose = require('mongoose');
// import easyinvoice
const easyinvoice = require('easyinvoice');

// const accountSid = tiloPersonalData.accountSid;
const accountSid = process.env.ACCOUNT_SID;
// const authToken = tiloPersonalData.authToken;
const authToken = process.env.AUTH_TOCKEN;
// const client = require('twilio')(accountSid, authToken);

// signup data
let userData = {
    name: "",
    email: "",
    phoneNumber: "",
};

// data to create invoice of order
let invoiceData = {
    "client": {
        "company": "Big Cart",
        "address": "Street 456",
        "zip": "Zip code",
        "country": "Country Name"
    },

    "information": {
        // Invoice number
        "number": "2021.0001",
        // Invoice data
        date: "12-12-2021",
    },

    products: [],

    "settings": {
        "currency": "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
    },

};

let loginErrorMessage;
let signupErrorMessage;
let otpErrormessage = '';
let otpTimeError = '';
let waitingOtp;

// rasor pay
let instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

// save user data to signup and to save after otp verification
let user;

// all categories
let categories;

function getCategories() {
    Categories.find({}, (err, data) => {
        if (data) {
            return data;
        } else {
            return [];
        }
    })
}

// a function to get all product categories
CategoriesGet = new Promise((resolve, reject) => {
    Categories.find({}, (err, data) => {
        if (data) {
            resolve(data);
        } else {
            if (err) {
                reject(err)
            } else {
                reject("no data found");
            }
        }
    })
})

exports.getLogin = (req, res, next) => {
    if (req.session.userLoggedIn) {
        res.redirect("/");
    } else {
        if (categories) {
            res.render("user/user-login", {
                user: "",
                errorMessage: loginErrorMessage,
                userType: 'user',
                categories: categories
            });
            loginErrorMessage = "";
        } else {
            CategoriesGet.then(data => {
                categories = data
                res.redirect('/user/login');
            })
                .catch(err => {
                    console.log(err);
                    res.redirect('user/login');
                })
        }
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
        if (data.length > 0 && data[0].userType === 'user') {

            // save user id to use other places
            req.session.userId = data[0].id

            // compare password if a user exist with the given email
            // bcrypt.compare(
            //     loginData.password,
            //     data[0].password,
            //     (err, isMatch) => {
            //         if (err) {
            //             throw err
            //         } else if (!isMatch) {
            //             console.log("password does not match");
            //             loginErrorMessage = "wrong email or password";
            //             res.redirect("login");
            //         } else {
            //             req.session.userLoggedIn = true;
            //             res.redirect("/");
            //         }
            //     }
            // )
            if (loginData.password === data[0].password) {
                req.session.userLoggedIn = true;
                res.redirect("/");
            } else {
                console.log("password does not match");
                loginErrorMessage = "wrong email or password";
                res.redirect("login");
            }
        } else {
            loginErrorMessage = "user not exist!";
            res.redirect("login");
        }
    })
}

exports.getSignup = (req, res, next) => {

    if (req.session.userLoggedIn) {
        res.redirect('/');
    } else {
        if (categories) {
            res.render("user/user-signup", {
                user: "",
                errorMessage: signupErrorMessage,
                categories: categories,
                userType: 'user',
                signupData: {
                    name: userData.name ? userData.name : '',
                    email: userData.email ? userData.email : '',
                    phoneNumber: userData.phoneNumber ? userData.phoneNumber : ''
                }
            });
            signupErrorMessage = "";
            // get rid the previous data
            userData = {
                name: "",
                email: "",
                phoneNumber: "",
            }
        } else {
            CategoriesGet.then(categories => {
                categories = categories;
                res.render("user/user-signup", {
                    user: "",
                    errorMessage: signupErrorMessage,
                    categories: categories,
                    userType: 'user',
                    signupData: {
                        name: userData.name ? userData.name : '',
                        email: userData.email ? userData.email : '',
                        phoneNumber: userData.phoneNumber ? userData.phoneNumber : ''
                    }
                });
                signupErrorMessage = "";
                // get rid the previous data
                userData = {
                    name: "",
                    email: "",
                    phoneNumber: "",
                }
            })
                .catch(err => {
                    console.log(err);
                    res.redirect("/user/signup");
                })
        }
    }
}

exports.postSignup = (req, res, next) => {

    // obtain all data user entered in signup form
    const signupData = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phone,
        userType: 'user'
    }

    userData = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phone,
    }

    // set salt round to bcrypt the password
    const saltRound = 10;

    // check is it exist or not
    User.find({
        phoneNumber: signupData.phoneNumber
    }, (err, data) => {
        if (data.length === 0) {
            // check is it exist or not
            User.find({
                email: signupData.email
            }, (err, data) => {

                // save user if it is not exist in database
                if (data.length === 0) {

                    // bcrypt the password
                    // bcrypt.genSalt(saltRound, (saltError, salt) => {
                    //     if (saltError) {
                    //         throw saltError
                    //     } else {
                    //         bcrypt.hash(signupData.password, salt, (hashError, hash) => {
                    //             if (hashError) {
                    //                 throw hashError
                    //             } else {

                    //                 // create User object or document
                    //                 user = new User({
                    //                     name: signupData.name,
                    //                     email: signupData.email,
                    //                     phoneNumber: signupData.phoneNumber,
                    //                     password: hash,
                    //                     userType: signupData.userType
                    //                 })
                    //                 user.save()
                    //                     .then(result => {
                    //                         user = "";
                    //                         res.redirect("/user/login");
                    //                     })
                    //                     .catch(err => {
                    //                         console.log(err);
                    //                         signupErrorMessage = "we are very sory! trouble in creating user! try after sometime or contact us"
                    //                         res.redirect("/user/signup");
                    //                     })
                    //                 // send created otp
                    //                 // client.verify.v2.services(process.env.VERIFY_TOCKEN)
                    //                 //     .verifications
                    //                 //     .create({
                    //                 //         to: `+91${user.phoneNumber}`,
                    //                 //         channel: 'sms'
                    //                 //     })
                    //                 //     .then(verification => {
                    //                 //         console.log(verification.status)

                    //                 //         // destroy the othp after 30 seconds
                    //                 //         setTimeout(() => {
                    //                 //             waitingOtp = "";
                    //                 //             otpTimeError = "Time is over! try again!"
                    //                 //         }, 30000);
                    //                 //         // show the page to enter otp
                    //                 //         res.redirect("/user/otp")
                    //                 //     })
                    //                 //     .catch(err => {
                    //                 //         console.log(err);
                    //                 //         otpErrormessage = "make sure the phone number is correct";
                    //                 //     })
                    //             }
                    //         })
                    //     }
                    // })

                    // create User object or document
                    user = new User({
                        name: signupData.name,
                        email: signupData.email,
                        phoneNumber: signupData.phoneNumber,
                        password: signupData.password,
                        userType: signupData.userType
                    })
                    user.save()
                        .then(result => {
                            user = "";
                            res.redirect("/user/login");
                        })
                        .catch(err => {
                            console.log(err);
                            signupErrorMessage = "we are very sory! trouble in creating user! try after sometime or contact us"
                            res.redirect("/user/signup");
                        })
                } else {
                    signupErrorMessage = "user already exist";
                    console.log("emil exist");
                    res.redirect("/user/signup");
                }
            })
        } else {
            signupErrorMessage = "mobile already exist";
            console.log("mobile exist");
            res.redirect("/user/signup");
        }
    })
}

// to show the page to enter otp
exports.otpVerify = (req, res, next) => {
    if (categories) {
        res.render("user/otp", {
            errorMessage: otpErrormessage,
            categories: categories,
            userType: "user",
            user: '',
            otpTimeError: otpTimeError,
        });
        otpTimeError = "";
        otpErrormessage
    } else {
        CategoriesGet
            .then(categories => {
                res.render("user/otp", {
                    errorMessage: otpErrormessage,
                    categories: categories,
                    userType: "user",
                    user: '',
                    otpTimeError: otpTimeError,
                });
                otpErrormessage = "";
                otpTimeError = '';
            })
            .catch(err => {
                res.render("user/otp", {
                    errorMessage: otpErrormessage,
                    categories: [],
                    userType: "user",
                    user: '',
                    errorMessage: otpErrormessage,
                    otpTimeError: otpTimeError,
                });
                otpErrormessage = "";
                otpTimeError = '';
            })
    }

}

// check otp and save user data
exports.postSignupOtp = (req, res, next) => {

    try {
        client.verify.v2.services(process.env.VERIFY_TOCKEN)
            .verificationChecks
            .create({
                to: `+91${user.phoneNumber}`,
                code: `${req.body.otp}`
            })
            .then(verification_check => {
                console.log(verification_check.status);
                if (verification_check.status === 'approved') {
                    // save the user
                    user.save()
                        .then(result => {
                            user = "";
                            res.redirect("/user/login");
                        })
                        .catch(err => {
                            console.log(err);
                            signupErrorMessage = "we are very sory! trouble in creating user! try after sometime or contact us"
                            res.redirect("/user/signup");
                        })
                } else {
                    console.log("incorrect otp");
                    otpErrormessage = "incorrect otp";
                    res.redirect("/user/otp");
                }
            })
            .catch(err => {
                conosle.log(err);
                console.log("incorrect otp");
                otpErrormessage = "incorrect otp";
                res.redirect("/user/otp");
            })
    } catch {
        console.log("some error while verifying otp");
        res.redirect("/user/otp");
    }
}

exports.showWishlist = (req, res, next) => {
    if (req.session.userLoggedIn) {
        try {
            // get user watchlist
            Wishlist.aggregate([{
                $unwind: "$products"
            }, {
                $match: {
                    _id: mongoose.Types.ObjectId(req.session.userId)
                }
            }, {
                $lookup: {
                    from: "products",
                    localField: "products",
                    foreignField: "_id",
                    as: "product_details"
                }
            }])
                .then(data => {
                    if (data) {
                        res.render("user/wishlist", {
                            user: "true",
                            userType: "user",
                            wishlist: data,
                            categories: []
                        })
                    }
                })
                .catch(err => {
                    res.render("user/wishlist", {
                        user: "true",
                        userType: "user",
                        wishlist: "empty",
                        categories: []
                    })
                })
        } catch {
            res.redirect("/");
        }
    } else {
        res.redirect("/user/login");
    }
}

exports.addToWishList = (req, res, next) => {
    if (req.session.userLoggedIn) {
        try {
            // save to wishlist
            Wishlist.findByIdAndUpdate(req.session.userId, {
                $push: {
                    'products': mongoose.Types.ObjectId(req.params.productId)
                }
            }, {
                upsert: true
            })
                .catch(err => {
                })
        } catch {
            res.redirect("/");
        }
    } else {
        res.redirect("/user/login");
    }
}

exports.removeFromWishlist = (req, res, next) => {
    if (req.session.userLoggedIn) {
        try {
            // remove from whatch list
            const productId = req.params.prodId;
            Wishlist.updateOne({
                _id: mongoose.Types.ObjectId(req.session.userId)
            }, {
                $pullAll: {
                    products: [mongoose.Types.ObjectId(productId)]
                }
            })
                .then(data => {
                })
                .catch(err => {
                })
        } catch {
            res.redirect("/user/showWishlist");
        }
    } else {
        res.redirect("/user/login");
    }

}

exports.showCart = (req, res, next) => {
    if (req.session.userLoggedIn) {
        // get cart data
        if (categories) {
            Cart.find({
                userId: req.session.userId
            }, (err, data) => {
                if (data) {
                    if (data.length !== 0 && data[0].products.length > 0) {
                        Product.find({
                            id: {
                                $in: [...data[0].products]
                            }
                        }, (err, products) => {
                            if (products) {
                                res.render("user/my-cart", {
                                    user: "user",
                                    categories: categories,
                                    userType: "user",
                                    cartData: data,
                                    productsData: products,
                                    cart: data[0].products.length > 0 ? true : false
                                });
                            } else {
                                console.log(err)
                                console.log("error while geting cart products data");
                                res.redirect("/");
                            }
                        })
                    } else {
                        console.log("emptycart")
                        res.render("user/my-cart", {
                            user: "user",
                            categories: categories,
                            userType: "user",
                            cartData: '',
                            productsData: '',
                            cart: false
                        });
                    }
                } else {
                    res.render("user/my-cart", {
                        user: "user",
                        categories: categories,
                        userType: "user",
                        cartData: '',
                        productsData: '',
                        cart: false
                    });
                }
            })
        } else {
            res.redirect("/user/login");
        }
    } else {
        res.redirect("/");
    }
}

// this is for post requests
// from details page with quantity and data. not using ajax
exports.addToCart = (req, res, next) => {
    if (req.session.userLoggedIn) {

        // save the cart data
        const cartData = {
            productId: req.body.id,
            quantity: req.body.quantity,
            price: req.body.price
        }

        // get the previous cart data
        Cart.findOne({
            userId: req.session.userId
        }, (err, data) => {
            console.log(data)

            if (data) {
                if (data.length !== 0) {
                    // create a new cart if the user has no a cart
                    if (data.products.length === 0) {

                        data.products = [{
                            productId: cartData.productId,
                            quantity: cartData.quantity,
                            price: cartData.price
                        }]

                        // save the new cart
                        data.save()
                            .then(result => {
                                console.log(result)
                                res.redirect("/showProducts");
                            })
                            .catch(err => {
                                console.log(err);
                                res.redirect("/showProducts");
                            })
                    } else {

                        // update the cart if there is an existing cart
                        let k = 0;
                        for (i of data.products) {
                            k++;

                            // increase the quantity and the total price of the cart if the product 
                            // already exist in the cart
                            if (i.productId === cartData.productId) {
                                i.price = Number(i.price) + Number(cartData.quantity * cartData.price);
                                i.quantity = Number(i.quantity) + Number(cartData.quantity);
                                data.save()
                                    .then(result => {
                                        res.redirect("/showProducts");
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        res.redirect("/showProducts");
                                    })

                                break;
                            } else {

                                // add the product and quantity and price if the product not exist in cart
                                if (k === data.products.length) {
                                    data.products.push({
                                        productId: cartData.productId,
                                        quantity: cartData.quantity,
                                        price: cartData.quantity * cartData.price
                                    })
                                    data.save()
                                        .then(result => {
                                            console.log(result)
                                            res.redirect("/showProducts");
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.redirect("/showProducts");
                                        })
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    const cart = new Cart({
                        userId: req.session.userId,
                        products: [{
                            productId: cartData.productId,
                            quantity: cartData.quantity,
                            price: cartData.quantity * cartData.price
                        }]
                    })

                    // save the new cart
                    cart.save()
                        .then(result => {
                            res.redirect("/showProducts");
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect("/showProducts");
                        })
                }
            } else {
                const cart = new Cart({
                    userId: req.session.userId,
                    products: [{
                        productId: cartData.productId,
                        quantity: cartData.quantity,
                        price: cartData.quantity * cartData.price
                    }]
                })

                // save the new cart
                cart.save()
                    .then(result => {
                        res.redirect("/showProducts");
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect("/showProducts");
                    })
            }
        })
    } else {
        res.redirect("/user/login");
    }
}

// add a product to cart with ajax
exports.getAddToCart = (req, res, next) => {

    if (req.session.userLoggedIn) {
        // save the product id user sended
        let prodId = req.params.productId;

        // get the product data
        Product.findById(prodId)
            .then(productData => {
                if (productData !== null) {

                    // save the cart data
                    const cartData = {
                        productId: prodId,
                        quantity: 1,
                        price: productData.price
                    }

                    // get the previous cart data
                    Cart.findOne({
                        userId: req.session.userId
                    }, (err, data) => {
                        console.log(data)

                        if (data) {
                            if (data.length !== 0) {
                                // create a new cart if the user has no a cart
                                if (data.products.length === 0) {

                                    data.products = [{
                                        productId: cartData.productId,
                                        quantity: cartData.quantity,
                                        price: cartData.price
                                    }]

                                    // save the new cart
                                    data.save()
                                        .then(result => {
                                            console.log(result)
                                            res.redirect("/showProducts");
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.redirect("/showProducts");
                                        })
                                } else {

                                    // update the cart if there is an existing cart
                                    let k = 0;
                                    for (i of data.products) {
                                        k++;

                                        // increase the quantity and the total price of the cart if the product 
                                        // already exist in the cart
                                        if (i.productId === cartData.productId) {
                                            i.price = Number(i.price) + Number(cartData.quantity * cartData.price);
                                            i.quantity = Number(i.quantity) + Number(cartData.quantity);
                                            data.save()
                                                .then(result => {
                                                    res.redirect("/showProducts");
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.redirect("/showProducts");
                                                })

                                            break;
                                        } else {

                                            // add the product and quantity and price if the product not exist in cart
                                            if (k === data.products.length) {
                                                data.products.push({
                                                    productId: cartData.productId,
                                                    quantity: cartData.quantity,
                                                    price: cartData.quantity * cartData.price
                                                })
                                                data.save()
                                                    .then(result => {
                                                        console.log(result)
                                                        res.redirect("/showProducts");
                                                    })
                                                    .catch(err => {
                                                        console.log(err);
                                                        res.redirect("/showProducts");
                                                    })
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                const cart = new Cart({
                                    userId: req.session.userId,
                                    products: [{
                                        productId: cartData.productId,
                                        quantity: cartData.quantity,
                                        price: cartData.quantity * cartData.price
                                    }]
                                })

                                // save the new cart
                                cart.save()
                                    .then(result => {
                                        res.redirect("/showProducts");
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        res.redirect("/showProducts");
                                    })
                            }
                        } else {
                            const cart = new Cart({
                                userId: req.session.userId,
                                products: [{
                                    productId: cartData.productId,
                                    quantity: cartData.quantity,
                                    price: cartData.quantity * cartData.price
                                }]
                            })

                            // save the new cart
                            cart.save()
                                .then(result => {
                                    res.redirect("/showProducts");
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.redirect("/showProducts");
                                })
                        }
                    })
                } else {
                    console.log("null returned by findById");
                }
            })
            .catch(err => {
                console.log("error in finding product");
            })
    }
}

exports.getDecreaseCartQuantity = (req, res, next) => {
    console.log("reached")
    if (req.session.userLoggedIn) {
        // save the product id user sended
        let prodId = req.params.productId.slice(0, -1);

        // get the product data
        Product.findById(prodId)
            .then(productData => {
                if (productData !== null) {

                    // save the cart data
                    const cartData = {
                        productId: prodId,
                        quantity: -1,
                        price: productData.price
                    }

                    // get the previous cart data
                    Cart.findOne({
                        userId: req.session.userId
                    }, (err, data) => {
                        console.log(data)

                        if (data) {
                            if (data.length !== 0) {
                                // create a new cart if the user has no a cart
                                if (data.products.length === 0) {

                                    data.products = [{
                                        productId: cartData.productId,
                                        quantity: cartData.quantity,
                                        price: cartData.price
                                    }]

                                    // save the new cart
                                    data.save()
                                        .then(result => {
                                            console.log(result)
                                            res.redirect("/showProducts");
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.redirect("/showProducts");
                                        })
                                } else {

                                    // update the cart if there is an existing cart
                                    let k = 0;
                                    for (i of data.products) {
                                        k++;

                                        // increase the quantity and the total price of the cart if the product 
                                        // already exist in the cart
                                        if (i.productId === cartData.productId) {
                                            i.price = Number(i.price) + Number(cartData.quantity * cartData.price);
                                            i.quantity = Number(i.quantity) + Number(cartData.quantity);
                                            data.save()
                                                .then(result => {
                                                    res.redirect("/showProducts");
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.redirect("/showProducts");
                                                })

                                            break;
                                        } else {

                                            // add the product and quantity and price if the product not exist in cart
                                            if (k === data.products.length) {
                                                data.products.push({
                                                    productId: cartData.productId,
                                                    quantity: cartData.quantity,
                                                    price: cartData.quantity * cartData.price
                                                })
                                                data.save()
                                                    .then(result => {
                                                        console.log(result)
                                                        res.redirect("/showProducts");
                                                    })
                                                    .catch(err => {
                                                        console.log(err);
                                                        res.redirect("/showProducts");
                                                    })
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                const cart = new Cart({
                                    userId: req.session.userId,
                                    products: [{
                                        productId: cartData.productId,
                                        quantity: cartData.quantity,
                                        price: cartData.quantity * cartData.price
                                    }]
                                })

                                // save the new cart
                                cart.save()
                                    .then(result => {
                                        res.redirect("/showProducts");
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        res.redirect("/showProducts");
                                    })
                            }
                        } else {
                            const cart = new Cart({
                                userId: req.session.userId,
                                products: [{
                                    productId: cartData.productId,
                                    quantity: cartData.quantity,
                                    price: cartData.quantity * cartData.price
                                }]
                            })

                            // save the new cart
                            cart.save()
                                .then(result => {
                                    res.redirect("/showProducts");
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.redirect("/showProducts");
                                })
                        }
                    })
                } else {
                    console.log("null returned by findById");
                }
            })
            .catch(err => {
                console.log("error in finding product");
            })
    }
}

exports.removeFromCart = (req, res, next) => {
    cartProduct = req.params.productId
    Cart.find({
        userId: req.session.userId
    }, (err, data) => {
        console.log(data)
        // try {
        if (data) {
            let index = data[0].products.findIndex(p => p.productId == cartProduct);
            if (index > -1) {
                data[0].products.splice(index, 1);
                console.log(data)
                Cart.updateOne({
                    userId: req.session.userId
                }, {
                    products: [...data[0].products]
                }, (err, data) => {
                    if (data) {
                        console.log(data)
                    }
                })
            }
        }
        // } catch {
        // console.log("error found");
        // }
    })
}

exports.applyCoupon = (req, res, next) => {
    const coupon = req.body.coupon;
    let cartTotal = Number(req.body.price);
    // console.log(cartTotal);
    Coupon.find({
        coupon: coupon
    }, (err, data) => {
        if (!err) {
            if (data.length > 0) {
                User.aggregate([{
                    '$match': {
                        '_id': new mongoose.Types.ObjectId(req.session.userId)
                    }
                }, {
                    '$project': {
                        'couponsAppied': 1
                    }
                }, {
                    '$unwind': {
                        'path': '$couponsAppied'
                    }
                }, {
                    '$match': {
                        "couponsAppied.coupon": coupon
                    }
                }])
                    .then(result => {
                        if (result.length > 0) {
                            console.log(result);
                            console.log("this coupon is already used!");
                            let responseData = {
                                price: cartTotal,
                                message: "this coupon is already used!",
                                discount: 0
                            }
                            res.json(responseData)
                        } else {

                            // success case;
                            // user didn't used the coupon before;
                            // Let him go ahead
                            // console.log(result);
                            // save coupon in session
                            req.session.coupon = coupon;
                            let descountPrice = (cartTotal * data[0].discountPercentage) / 100;
                            cartTotal -= (cartTotal * data[0].discountPercentage) / 100;
                            let responseData = {
                                price: cartTotal,
                                discount: descountPrice,
                                message: ""
                            }
                            res.json(responseData)
                        }
                    })
                    .catch(err => {
                        // console.log(err);
                        // console.log("error in finding coupondata");
                        let responseData = {
                            price: cartTotal,
                            message: "something went wrong while applying coupon! try later",
                            discount: 0
                        }
                        res.json(responseData)
                    })
            } else {
                let responseData = {
                    price: cartTotal,
                    message: "coupon not exist",
                    discount: 0
                }
                res.json(responseData)
            }
        } else {
            res.json({
                price: cartTotal,
                message: "womething wring while checking coupon! please try later or contact us",
                discount: 0
            });
        }
    })

}

// /user/checkout?cartPrice
exports.getCheckout = (req, res, next) => {
    if (req.session.userLoggedIn) {
        req.session.cartPrice = Number(req.query.cartPrice);
        // console.log(`cart price: ${req.query.cartPrice},  type: ${typeof(req.session.cartPrice)}`);
        User.findById(req.session.userId)
            .then(data => {
                if (data) {
                    Cart.find({
                        user: req.session.userId
                    }, (err, cart) => {
                        if (cart) {
                            res.render("user/checkout", {
                                user: "true",
                                cart: cart,
                                cartPrice: req.query.cartPrice,
                                categories: categories ? categories : getCategories(),
                                userType: "user",
                                address: data.address.length > 0 ? data.address : "",
                                discount: req.query.discount
                            });
                        }
                    })
                } else {
                    res.redirect("/");
                }
            })
    } else {
        res.redirect("/user/login");
    }
}

exports.placeOrder = (req, res, next) => {
    console.log('hi');
    if (req.session.userLoggedIn) {
        let paymentMethod = req.body.paymentMethod;
        let currentDate = new Date().toJSON().slice(0, 10);
        let today = new Date();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let address;
        let orders = [];
        let userName;
        let orderId;

        function generateRazorPay(id, totalPrice) {
            console.log('razore promise')
            return new Promise((resolve, reject) => {
                var options = {
                    amount: parseInt(totalPrice) * 100, // amount in the smallest currency unit
                    currency: "INR",
                    receipt: id
                };
                console.log(options);
                console.log(options);
                console.log(instance);
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log(err)
                    } else {
                        resolve(order);
                    }
                });
            })
        }

        function saveCouponDetails() {
            if (req.session.coupon) {
                User.findByIdAndUpdate(req.session.userId, {
                    $push: {
                        couponsAppied: {
                            year: currentDate,
                            coupon: req.session.coupon
                        }
                    }
                })
                    .then(data => {
                        // console.log(data);
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        }

        if (req.body.addressId) {
            console.log('address exists')
            User.findById(req.session.userId)
                .then(user => {
                    address = user.address[req.body.addressId - 1]
                    return Cart.find({
                        userId: user.id
                    });
                })
                .then(cart => {
                    orders.push({
                        date: currentDate,
                        time: time,
                        price: req.session.cartPrice,
                        address: address,
                        paymentMethod: paymentMethod,
                        products: [...cart[0].products],
                        orderStatus: 'placed',
                        discount: Number(req.body.discount)
                    })
                    return Cart.updateOne({
                        userId: req.session.userId
                    }, {
                        products: []
                    })
                })
                .then(updatedCart => {
                    return User.findById(req.session.userId)
                })
                .then(userData => {
                    userName = userData.name;
                    userData.orders = [
                        ...userData.orders,
                        ...orders
                    ]
                    return userData.save();
                })
                .then(result => {
                    orderId = result.orders[result.orders.length - 1].id
                    for (product of orders[0].products) {
                        return Product.findById(product.productId)
                            .then(productData => {
                                let newOrder = {
                                    date: currentDate,
                                    time: time,
                                    price: Number(product.price),
                                    paymentMethod: paymentMethod,
                                    userName: userName,
                                    userId: req.session.userId,
                                    userOrderId: orderId,
                                    orderStatus: 'placed',
                                    address: address,
                                    productId: mongoose.Types.ObjectId(product.productId)
                                }
                                return Order.updateOne({
                                    sellerId: productData.user
                                }, {
                                    $push: {
                                        orders: newOrder
                                    }
                                })
                            })
                            .then(result => {
                                // console.log(result)
                            })
                            .catch(err => {
                                // console.log(err)
                                res.redirect('/')
                            })
                    }
                })
                .then(data => {
                    saveCouponDetails();
                    if (req.body.paymentMethod !== 'cashOnDelivery') {
                        generateRazorPay(orderId, req.session.cartPrice)
                            .then(response => {
                                res.json(response)
                            })
                    }
                })
                .catch(err => {
                    console.log(err);
                    console.log("error in order plasing!");
                    res.redirect('/');
                })
        } else {
            const address = {
                home: req.body.home,
                street: req.body.street,
                district: req.body.district,
                state: req.body.state,
                city: req.body.city,
                country: req.body.country,
                zip: req.body.zip
            }
            let userId = req.session.userId

            // save new address to user data
            User.findByIdAndUpdate(userId, {
                $push: {
                    address: address
                }
            }, (err, data) => {
                if (data) {
                    console.log("address updated")
                } else if (err) {
                    console.log("\n\nerror in updating address")
                    console.log(err)
                }
            })

            Cart.find({
                userId: req.session.userId
            })
                .then(cart => {
                    orders.push({
                        date: currentDate,
                        time: time,
                        price: req.session.cartPrice,
                        address: address,
                        paymentMethod: paymentMethod,
                        products: [...cart[0].products],
                        orderStatus: 'placed'
                    })
                    return Cart.updateOne({
                        userId: req.session.userId
                    }, {
                        products: []
                    })
                })
                .then(updatedCart => {
                    return User.findById(req.session.userId)
                })
                .then(userData => {
                    userData.orders = [
                        ...userData.orders,
                        ...orders
                    ]
                    return userData.save();
                })
                .then(result => {
                    let orderId = result.orders[result.orders.length - 1].id
                    for (product of orders[0].products) {
                        return Product.findById(product.productId)
                            .then(productData => {
                                let newOrder = {
                                    date: currentDate,
                                    time: time,
                                    price: Number(product.price),
                                    paymentMethod: paymentMethod,
                                    userId: req.session.userId,
                                    userOrderId: orderId,
                                    userName: userName,
                                    orderStatus: 'placed',
                                    address: address
                                }
                                return Order.updateOne({
                                    sellerId: productData.user
                                }, {
                                    $push: {
                                        orders: newOrder
                                    }
                                })
                            })
                            .then(result => {
                                // console.log(result)
                            })
                            .catch(err => {
                                console.log(err)
                                res.redirect('/')
                            })
                    }
                })
                .then(data => {
                    saveCouponDetails();
                    if (req.body.paymentMethod !== 'cashOnDelivery') {
                        generateRazorPay(orderId, req.session.cartPrice)
                            .then(response => {
                                res.json(response)
                            })
                    }
                })
                .catch(err => {
                    console.log(err);
                    console.log("error in order plasing!");
                    res.redirect('/');
                })
            orders = [];

        }
    } else {
        res.redirect("/")
    }
}

exports.myAccount = (req, res, next) => {
    try {
        function findUserData() {
            User.findById(req.session.userId)
                .then(userData => {
                    if (userData) {
                        res.render("user/my-profile", {
                            user: "true",
                            userType: "user",
                            userData: userData,
                            categories: categories,
                            userDataError: ""
                        })
                    } else {
                        res.render("user/my-profile", {
                            user: "true",
                            userType: "user",
                            userData: [],
                            userDataError: "error while fetching user data! try again later",
                            categories: categories
                        })
                    }
                })
        }

        if (req.session.userLoggedIn) {
            if (categories) {
                findUserData();
            } else {
                CategoriesGet.then(categories => {
                    categories = categories
                    findUserData();
                })
                    .catch(err => {
                        console.log(err);
                        categories = [];
                        res.redirect("/");
                    })
            }
        } else {
            res.redirect('/');
        }
    } catch {
        res.redirect("/");
    }
}

exports.addAddress = (req, res, next) => {
    if (req.session.userLoggedIn) {
        let addressData = {
            home: req.body.home,
            street: req.body.street,
            district: req.body.district,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            zip: req.body.zip
        }
        console.log(addressData);
        User.findByIdAndUpdate({
            _id: mongoose.Types.ObjectId(req.session.userId)
        }, {
            $push: {
                address: {
                    ...addressData
                }
            }
        })
            .then(savedAddress => {
                res.json("saved");
            })
            .catch(err => {
                res.json("addressError");
            })
    }
}

exports.myOrders = (req, res, next) => {
    if (req.session.userLoggedIn) {
        CategoriesGet.then(categories => {
            categories = categories;
            User.findById(req.session.userId)
                .then(userData => {
                    res.render("user/my-orders", {
                        user: "true",
                        userType: "user",
                        categories: categories,
                        orders: userData.orders.reverse()
                    })
                })
                .catch(err => {
                    console.log(err);
                    res.redirect("/");
                })
        })
            .catch(err => {
                console.log(err);
                categories = [];
                res.redirect("/user/myProfile");
            })
    } else {
        res.redirect('/user/login');
    }
}

exports.orderDetails = (req, res, next) => {
    if (req.session.userLoggedIn) {
        // function to render
        function orderDetails(req, res, next) {
            const orderId = req.params.orderId;
            User.findById(req.session.userId, (err, data) => {
                if (data) {
                    let index = data.orders.findIndex(p => p.id === orderId)
                    if (index !== -1) {
                        let orderDetails = data.orders[index];
                        let products = orderDetails.products.map(p => {
                            return p.productId;
                        })

                        Product.find({
                            _id: {
                                $in: products
                            }
                        })
                            .then(data => {
                                res.render("user/order-details", {
                                    user: "true",
                                    userType: "user",
                                    categories: categories,
                                    orderDetails: orderDetails,
                                    products: data
                                });
                                // invoiceData.products = data;
                                // console.log(data);
                                invoiceData.products = [];
                                for (i of data) {
                                    for (k of orderDetails.products) {
                                        if (i.id === k.productId) {
                                            invoiceData.products.push({
                                                "quantity": k.quantity,
                                                "description": i.title,
                                                "price": i.price
                                            },)
                                        }
                                    }
                                }
                                easyinvoice.createInvoice(invoiceData, function (result) {
                                    /*  
                                        5.  The 'result' variable will contain our invoice as a base64 encoded PDF
                                            Now let's save our invoice to our local filesystem so we can have a look!
                                            We will be using the 'fs' library we imported above for this.
                                    */
                                    fs.writeFileSync("./public/invoice/invoice.pdf", result.pdf, 'base64');
                                });
                            })
                    }
                } else {
                    res.redirect("/")
                }
            })
        }
        if (categories) {
            orderDetails(req, res, next)
        } else {
            CategoriesGet.then(categories => {
                categories = categories
                orderDetails(req, res, next);
            })
                .catch(err => {
                    console.log(err);
                    categories = [];
                    res.redirect("/user/myAccount");
                })
        }
    } else {
        res.redirect('/');
    }
}

exports.downloadInvoice = (req, res, next) => {
    res.download("./public/invoice/invoice.pdf");
}

exports.cancelOrder = (req, res, next) => {
    if (req.session.userLoggedIn) {
        const orderId = req.params.orderId;
        User.findById(req.session.userId)
            .then(data => {
                const index = data.orders.findIndex(order => order.id === orderId);
                if (index !== -1) {
                    data.orders[index].orderStatus = 'cancelled'
                    data.save()
                        .then(data => {
                            // this aggregate method is not functioning. cancellation wirking becouse of updateMany and code above this
                            console.log("cancelled")
                            res.redirect('/user/myOrders')
                            return Order.aggregate([{
                                $unwind: "$orders"
                            }, {
                                $match: {
                                    'orders.userOrderId': orderId
                                }
                            }, {
                                $addFields: {
                                    'orders.orderStatus': 'cancelled'
                                }
                            }])
                        })
                        .then(data => {
                            console.log("cancelled")
                            return Order.updateMany({
                                'orders.userOrderId': orderId
                            }, {
                                $set: {
                                    "orders.$[].orderStatus": 'cancelled'
                                }
                            })
                        })
                        .then(data => {
                            console.log(data);
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/user/myOrders')
                        })
                }
            })
    } else {
        res.redirect("/user/login");
    }
}

exports.userLogout = (req, res, next) => {
    req.session.userLoggedIn = false;

    res.redirect("/");
}