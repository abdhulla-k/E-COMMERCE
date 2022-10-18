const Category = require("../models/product_category");
const User = require("../models/user");

const bcrypt = require("bcryptjs")

let categories;
let loginErrorMessage;

exports.getLogin = (req, res, next) => {
    Category.find({}, (err, data) => {
        if (data) {
            categories = data;
            if (req.session.adminLoggedIn) {
                req.session.imageNames = [];
                res.render("admin/admin-dashboard", {
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "admin",
                    categories: categories
                });
            } else {
                res.render("admin/login", {
                    user: "",
                    errorMessage: loginErrorMessage,
                    userType: "admin",
                    categories: categories
                });
                loginErrorMessage = "";
            }
        }
    })
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
            if (data[0].userType === 'admin') {
                // save user id to use other places
                req.session.adminId = data[0].id

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
                            res.redirect("/admin/");
                        } else {
                            req.session.adminLoggedIn = true;
                            // console.log( req.session.userType );
                            res.redirect("/admin/");
                        }
                    }
                )
            } else {
                console.log("seller not exist");
                loginErrorMessage = "admin not exist with this cridentials!";
                res.redirect("/admin/");
            }
        } else {
            loginErrorMessage = "wrong cridentials!";
            res.redirect("/admin/");
        }
    })
}

exports.showUsers = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        User.aggregate([{
            $match: {
                'userType': 'user'
            }
        }])
        .then(data => {
            res.render("admin/all-users", {
                userType: "admin",
                user: "",
                userData: data
            });
        })
        .catch(err => {
            res.redirect('/admin/');
        })
    } else {
        res.redirect("/admin/");
    }
}

exports.addCategory = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        res.render("admin/add-category", {
            userType: "admin",
            user: ""
        });
    } else {
        res.redirect("/admin/")
    }
}

exports.postSaveCategory = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const newCategory = req.body.category

        Category.find({
            categoryName: newCategory
        }, (err, data) => {
            if (data.length === 0) {
                const category = new Category({
                    categoryName: newCategory
                })
                category.save()
                    .then(result => {
                        console.log("category created");
                        res.redirect("/admin/addCategory");
                    })
                    .catch(err => {
                        console.log("error while createing new category");
                        res.redirect("/admin/addCategory");
                    })
            } else {
                console.log("category already exist");
                res.redirect("/admin/addCategory");
            }
        })
    }
}

exports.logout = (req, res, next) => {
    req.session.adminLoggedIn = false;
    res.redirect('/admin/');
}