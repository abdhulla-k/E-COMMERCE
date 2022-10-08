const User = require("../models/user");
const Categories = require("../models/product_category");

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
                                        userType: 'user'
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
    res.render("user/my-cart", {
        user: "",
        categories: categories,
        userType: "user"
    });
}

exports.userLogout = (req, res, next) => {
    req.session.userLoggedIn = false;

    res.redirect("/");
}