const Product = require("../models/product");
const User = require("../models/user");
const Category = require("../models/product_category");
const Orders = require("../models/orders");

let filterKey = [];
let editnigProdId;

// import bcryptjs third party module
const bcrypt = require("bcryptjs");

let loginErrorMessage;
let signupErrorMessage;
let categories;

exports.getLogin = (req, res, next) => {
    Category.find({}, (err, data) => {
        if (data) {
            categories = data;
            if (req.session.sellerLoggedIn) {
                req.session.imageNames = [];
                res.render("seller/seller-dashboard", {
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "seller",
                    categories: categories
                });
            } else {
                res.render("seller/seller-login", {
                    user: "",
                    errorMessage: loginErrorMessage,
                    userType: "seller",
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
        // check is it editing mode or not
        if (req.session.productEditing) {
            req.session.productEditing = false;
            res.render("seller/add-products", {
                user: req.session.sellerLoggedIn ? "true" : "",
                userType: "seller",
                loginFrom: 'seller',
                editing: true,
                productId: editnigProdId,
                categories: categories,
                productDetails: req.session.editingProduct
            });
        } else {
            res.render("seller/add-products", {
                user: req.session.sellerLoggedIn ? "true" : "",
                userType: "seller",
                categories: categories,
                editing: false
            });
        }
    } else {
        res.redirect("/seller/");
    }
}

exports.postAddProduct = (req, res, next) => {
    let imagesName = [];
    for (file of req.files) {
        imagesName.push(file.filename)
    }
    const product = Product({
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        category: req.body.category,
        user: req.session.sellerId,
        images: imagesName
    })

    product.save()
        .then(result => {
            console.log(result)
            res.redirect('/seller/');
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
                        ...filterKey
                    ]
                }
            }, (err, data) => {
                console.log(data);
                res.render("seller/my-products", {
                    products: data,
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "seller",
                    categories: categories,
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
                    categories: categories,
                    userType: "seller",
                });
            })
        }
    } else {
        res.redirect("/seller/");
    }
}

exports.myProductDetails = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        let userStatus = req.session.sellerLoggedIn ? "true" : "";

        const prodId = req.params.productId

        Product.findById(prodId)
            .then(product => {
                res.render("shop/detail", {
                    user: "seller",
                    userType: "seller",
                    productDetails: product,
                    userId: req.session.sellerId,
                    categories: categories,
                });
            }).catch(err => {
                console.log(err);
                res.redirect("/seller/");
            })
    } else {
        res.redirect("/seller/");
    }
}

exports.filterProducts = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        Category.find({}, (err, data) => {
            if (data) {
                if (req.body.all) {
                    req.session.filtering = false;
                    res.redirect("showMyProducts");
                } else {
                    // get rid previous filter key if ther it is
                    filterKey = [];
                    // don't want to filter if user asked all products
                    if (req.body.all) {
                        req.session.filtering = false;
                        res.redirect("showMyProducts");
                    } else {
                        req.session.filtering = true;

                        // get categories to filter
                        for (category of data) {
                            let key = category.categoryName;
                            if (req.body[key]) {
                                filterKey.push(category.id);
                            }
                        }
                        // filtering will be applied in showMyProducts
                        res.redirect("showMyProducts");
                    }
                }
            } else {
                res.redirect("/seller/");
            }
        })
    } else {
        res.redirect("/seller/");
    }
}

exports.editProduct = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        editnigProdId = req.params.productId;
        console.log(editnigProdId);
        Product.findById(editnigProdId)
            .then(product => {
                req.session.productEditing = true;
                req.session.editingProduct = product;
                res.redirect("/seller/addProduct/");
            })
            .catch(err => {
                console.log(err);
                res.redirect("/seller/");
            })
    } else {
        res.redirect("/seller/");
    }

}

// save edited product
exports.saveProductEdit = (req, res, next) => {
    if (req.session.sellerLoggedIn) {

        // get edited data
        const newProdData = {
            title: req.body.title,
            price: req.body.price,
            description: req.body.description,
            quantity: req.body.quantity,
            category: req.body.category
        }
        Product.findById(editnigProdId)
            .then(data => {

                // change the data and save it
                data.title = newProdData.title;
                data.price = newProdData.price;
                data.description = newProdData.description;
                data.quantity = newProdData.quantity;
                data.category = newProdData.category;
                // save new data
                return data.save();
            })
            .then(result => {
                res.redirect("/seller/showMyProducts");
            })
            .catch(err => {
                console.log(err);
                res.redirect("/seller/")
            })
    } else {
        res.redirect("/seller/");
    }
}

exports.deleteProduct = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        const prodId = req.params.productId;
        Product.findByIdAndRemove(prodId)
            .then(() => {
                console.log("deleted");
                res.redirect("/seller/showMyProducts");
            })
            .catch(err => {
                console.log(err);
                res.redirect("/seller/showMyProducts");
            })
    } else {
        res.redirect("/seller/");
    }
}

exports.showOrders = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        Orders.aggregate([{
                $match: {
                    sellerId: req.session.sellerId
                }
            }])
            .then(data => {
                if (data) {
                    console.log(data[0].orders)
                    res.render('seller/show-orders', {
                        user: req.session.sellerLoggedIn ? "true" : "",
                        userType: "seller",
                        categories: categories,
                        orderDetails: data[0].orders
                    })
                }
            })
            .catch(err => {
                console.log(err);
                res.render('seller/show-orders', {
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "seller",
                    categories: categories,
                    orderDetails: []
                })
            })
    } else {
        res.redirect('/seller/');
    }
}

exports.logout = (req, res, next) => {
    req.session.sellerLoggedIn = false;
    res.redirect("/seller/");
}