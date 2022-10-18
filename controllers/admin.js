const Category = require("../models/product_category");
const User = require("../models/user");
const Product = require("../models/product");

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

exports.showUserDetails = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const userId = req.params.userId;
        User.findById(userId, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            } else {
                res.render("admin/user-details", {
                    userType: "admin",
                    user: "",
                    userDetails: data,
                    route: 'details'
                });
            }
        })

    } else {
        res.redirect("/admin/");
    }
}

exports.showUserOrders = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const userId = req.params.userId;
        User.findById(userId, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            } else {
                res.render("admin/user-details", {
                    userType: "admin",
                    user: "",
                    userDetails: data,
                    route: 'orders'
                });
            }
        })

    } else {
        res.redirect("/admin/");
    }
}

exports.showUserOrderDetail = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const userId = req.params.orderId;
        const orderId = req.query.orderId;
        console.log(userId);
        console.log(orderId);
        User.findById(userId, (err, data) => {
            if (data) {
                let index = data.orders.findIndex(p => p.id === orderId)
                if (index !== -1) {
                    let orderDetails = data.orders[index]
                    let products = orderDetails.products.map(p => {
                        return p.productId;
                    })

                    Product.find({
                            _id: {
                                $in: products
                            }
                        })
                        .then(data => {
                            console.log(data)
                            console.log(products)
                            res.render("admin/user-order-details", {
                                user: "",
                                userType: "admin",
                                orderDetails: orderDetails,
                                products: data
                            });
                        })
                }
            } else {
                res.redirect("/admin/")
            }
        })
    } else {
        res.redirect("/admin/");
    }
}

exports.showSellers = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        User.aggregate([{
                $match: {
                    'userType': 'seller'
                }
            }])
            .then(data => {
                res.render("admin/all-seller", {
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

exports.showSerDetails = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const userId = req.params.sellerId;
        User.findById(userId, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            } else {
                res.render("admin/seller-details", {
                    userType: "admin",
                    user: "",
                    userDetails: data,
                    route: 'details'
                });
            }
        })

    } else {
        res.redirect("/admin/");
    }
}

exports.showSerOrders = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const userId = req.params.sellerId;
        User.findById(userId, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            } else {
                res.render("admin/seller-details", {
                    userType: "admin",
                    user: "",
                    userDetails: data,
                    route: 'orders'
                });
            }
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