const User = require("../models/user");
const Categories = require("../models/product_category");
const Cart = require("../models/cart");
const Product = require("../models/product");

// import bcryptjs third party module
const bcrypt = require("bcryptjs");

// import twilio to send otp
const tiloPersonalData = require("../tilo");
const accountSid = tiloPersonalData.accountSid;
const authToken = tiloPersonalData.authToken;
const client = require('twilio')(accountSid, authToken);

let loginErrorMessage;
let signupErrorMessage;
let otpErrormessage;
let waitingOtp;

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
            bcrypt.compare(
                loginData.password,
                data[0].password,
                (err, isMatch) => {
                    if (err) {
                        throw err
                    } else if (!isMatch) {
                        console.log("password does not match");
                        loginErrorMessage = "wrong email or password";
                        res.redirect("login");
                    } else {
                        req.session.userLoggedIn = true;
                        res.redirect("/");
                    }
                }
            )
        } else {
            console.log("user not exist");
            loginErrorMessage = "user not exist!";
            res.redirect("login");
        }
    })
}

exports.getSignup = (req, res, next) => {

    if (req.session.userLoggedIn) {
        res.redirect('/');
    } else {
        if (category) {
            res.render("user/user-signup", {
                user: "",
                errorMessage: signupErrorMessage,
                categories: categories,
                userType: 'user'
            });
            signupErrorMessage = "";
        } else {
            CategoriesGet.then(data => {
                    categories = data
                    res.redirect('user/user-signup');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/user/user-signup');
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
                            user = new User({
                                name: signupData.name,
                                email: signupData.email,
                                phoneNumber: signupData.phoneNumber,
                                password: hash,
                                userType: signupData.userType
                            })

                            // create otp 
                            let otpPromise = new Promise((res, rej) => {
                                let number = ''
                                let digits = "0123456789";
                                for (let i = 0; i < 2; i++) {
                                    number += digits[Math.floor(Math.random() * 10)]
                                }
                                if (number) {
                                    res(number);
                                } else {
                                    rej("error in otp generation");
                                }
                            })

                            // use otpPromise to create an otp
                            otpPromise.then(generatedOtp => {
                                    waitingOtp = generatedOtp;
                                    console.log(generatedOtp);

                                    // send created otp
                                    client.messages
                                        .create({
                                            body: generatedOtp,
                                            from: '+13854835372',
                                            to: '+916282679611'
                                        })
                                        .then(message => {
                                            otpErrormessage = "";
                                        })
                                        .done(
                                            console.log("done")
                                        );

                                    // destroy the othp after 30 seconds
                                    setTimeout(() => {
                                        waitingOtp = "";
                                        console.log(waitingOtp);
                                    }, 30000);

                                    // show the page to enter otp
                                    res.render("user/otp", {
                                        user: "",
                                        errorMessage: otpErrormessage,
                                        userType: 'user',
                                        categories: categories
                                    });
                                })
                                .catch(err => {
                                    console("error in otp createion");
                                    res.redirect("/");
                                })
                        }
                    })
                }
            })
        } else {
            signupErrorMessage = "user already exist";
            console.log("emil exist");
            res.redirect("signup");
        }
    })
}

// to show otp entering page
exports.otpVerify = (req, res, next) => {
    res.render("user/otp", {
        errorMessage: ""
    });
}

// check otp and save user data
exports.postSignupOtp = (req, res, next) => {

    if (waitingOtp == req.body.otp) {
        // save the user
        user.save()
            .then(result => {
                user = "";
                res.redirect("/user/login");
            })
            .catch(err => {
                console.log("error in user createion");
                console.log(err);
                res.redirect("/");
            })
    } else {
        console.log("incorrect otp");
        otpErrormessage = "incorrect otp";
        res.redirect("/otp");
    }
    otpErrormessage = "";
}

exports.showCart = (req, res, next) => {
    if (req.session.userLoggedIn) {
        // get cart data
        Cart.find({
            userId: req.session.userId
        }, (err, data) => {
            console.log(data)
            if (data) {
                if (data.length !== 0 && data[0].products.length > 0) {
                    Product.find({
                        id: {
                            $in: [...data[0].products]
                        }
                    }, (err, products) => {
                        if (products) {
                            // console.log(products)
                            // render the cart page
                            res.render("user/my-cart", {
                                user: "user",
                                categories: categories,
                                userType: "user",
                                cartData: data,
                                productsData: products,
                                cart: true
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
                    .then(err => {
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

                        if (data) {
                            // create a new cart if the user has no a cart
                            if (data.length === 0) {
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

// /user/checkout?cartPrice
exports.getCheckout = (req, res, next) => {
    if (req.session.userLoggedIn) {
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
                                address: data.address.length > 0 ? data.address : ""
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
    if (req.session.userLoggedIn) {
        let paymentMethod = req.body.paymentMethod;
        let currentDate = new Date().toJSON().slice(0, 10);
        let today = new Date();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let address;
        let orders = [];

        if (req.body.addressId) {
            User.findById(req.session.userId)
                .then(user => {
                    address = user.address[req.body.addressId - 1]
                    return Cart.find({
                        userId: user.id
                    });
                })
                .then(cart => {
                    for (product of cart[0].products) {
                        orders.push({
                            product: product.productId,
                            date: currentDate,
                            time: time,
                            quantity: product.quantity,
                            price: product.price,
                            address: address,
                            paymentMethod: paymentMethod
                        })
                    }
                    return Cart.updateOne({
                        userId: req.session.userId
                    }, {
                        products: []
                    })
                })
                .then(updatedCart => {
                    console.log(updatedCart)
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
                    console.log(result);
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/');
                })
        } else {
            console.log("nos");
        }
    } else {
        res.redirect("/")
    }
}

exports.userLogout = (req, res, next) => {
    req.session.userLoggedIn = false;

    res.redirect("/");
}