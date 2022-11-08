const Product = require("../models/product");
const User = require("../models/user");
const Category = require("../models/product_category");
const Orders = require("../models/orders");

let filterKey = [];
let editnigProdId;

// import bcryptjs third party module
const bcrypt = require("bcryptjs");
let mongoose = require("mongoose")

let loginErrorMessage;
let signupErrorMessage;
let categories;

exports.getLogin = (req, res, next) => {
    Category.find({}, (err, data) => {
        if (data) {
            categories = data;
            if (req.session.sellerLoggedIn) {
                req.session.imageNames = [];
                let categoryData;
                Orders.aggregate([{
                        $match: {
                            sellerId: req.session.sellerId
                        }
                    }, {
                        $unwind: "$orders"
                    }, {
                        $lookup: {
                            from: "products",
                            localField: "orders.productId",
                            foreignField: "_id",
                            as: "product"
                        }
                    }, {
                        $unwind: "$product"
                    }, {
                        $lookup: {
                            from: "categories",
                            localField: "product.category",
                            foreignField: "_id",
                            as: "category"
                        }
                    }, {
                        $unwind: "$category"
                    }, {
                        $group: {
                            _id: '$category.categoryName',
                            count: {
                                $sum: 1
                            }
                        }
                    }, {
                        $sort: {
                            count: 1
                        }
                    }])
                    .then(data => {
                        // save data
                        categoryData = data;

                        return Orders.aggregate([{
                            $unwind: "$orders"
                        }, {
                            $lookup: {
                                from: "products",
                                localField: "orders.productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        }, {
                            $unwind: "$product"
                        }, {
                            $lookup: {
                                from: "categories",
                                localField: "product.category",
                                foreignField: "_id",
                                as: "category"
                            }
                        }, {
                            $unwind: "$category"
                        }, {
                            $group: {
                                _id: '$category.categoryName',
                                count: {
                                    $sum: 1
                                }
                            }
                        }, {
                            $group: {
                                _id: null,
                                sumOfCount: {
                                    $sum: "$count"
                                }
                            }
                        }])
                    })
                    .then(sum => {
                        // console.log(categoryData);
                        // console.log(sum);
                        req.session.imageNames = [];
                        res.render("seller/seller-dashboard", {
                            user: "ture",
                            userType: "seller",
                            categories: categories,
                            categorySales: categoryData,
                            onePercentage: sum[0].sumOfCount / 100
                        });
                    })
                    .catch(err => {
                        req.session.imageNames = [];
                        res.render("seller/seller-dashboard", {
                            user: "true",
                            userType: "seller",
                            categories: categories,
                            categorySales: [],
                            sum: 0
                        });
                    })

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
                                    const order = new Orders({
                                        sellerId: result.id,
                                        orders: []
                                    })
                                    return order.save()
                                })
                                .then(orders => {
                                    console.log("created seller account");
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

// To share data to admin dashboard
exports.getDashboardData = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        let counter = 0;
        let date7days = [];
        let date44 = [];
        let onlinPayment = [0, 0, 0, 0, 0, 0, 0];
        let cod = [0, 0, 0, 0, 0, 0, 0];
        let orderAll = new Array(44).fill(0);
        let notCancelledOrder = new Array(44).fill(0);
        let cancelleOrder = new Array(44).fill(0);
        let income = [0, 0, 0, 0, 0, 0, 0];
        let expences = [0, 0, 0, 0, 0, 0, 0];
        let profit = new Array(8).fill(0);
        // function to find the last 7 days date
        async function Last7Days(a) {
            const past7Days = await [...Array(a).keys()].map(index => {
                const date = new Date();
                date.setDate(date.getDate() - index);
                currentVal = date.getFullYear() + ' - ' + date.getMonth() + ' - ' + date.getDate();

                return currentVal;
            });
            return past7Days
        }

        // find the online payment data
        Orders.aggregate([{
                    $unwind: "$orders"
                },
                {
                    $match: {
                        "orders.paymentMethod": "googlePay"
                    }
                },
                {
                    $group: {
                        _id: '$orders.date',
                        onlinePayment: {
                            $sum: 1
                        }
                    }
                },
                {
                    $limit: 7
                }
            ])
            .then(online => {
                // got online payment result here
                counter = 0;
                online.forEach(a => {
                    onlinPayment[counter] = a.onlinePayment;
                    counter++;
                })

                // find cod
                return Orders.aggregate([{
                        $unwind: "$orders"
                    },
                    {
                        $match: {
                            "orders.paymentMethod": 'cashOnDelivery'
                        }
                    },
                    {
                        $group: {
                            _id: '$orders.date',
                            cod: {
                                $sum: 1
                            },
                        }
                    },
                    {
                        $limit: 7
                    }
                ])

            })
            .then(result => {
                // got cod result here
                counter = 0;
                result.forEach(a => {
                    cod[counter] = a.cod;
                    counter++;
                })

                // find all orders
                return Orders.aggregate([{
                    $unwind: "$orders"
                }, {
                    $group: {
                        _id: "$orders.date",
                        count: {
                            $sum: 1
                        }
                    }
                }, {
                    $limit: 44
                }])
            })
            .then(orders => {

                // get all order details here. count
                let counter = 0;
                orders.forEach(a => {
                    // save the order count
                    notCancelledOrder[counter] = a.count;
                    counter++;
                })

                // find income and expences here
                return Orders.aggregate([{
                    $unwind: "$orders"
                }, {
                    $match: {
                        "orders.orderStatus": "placed"
                    }
                }, {
                    $group: {
                        _id: '$orders.date',
                        sum: {
                            $sum: "$orders.price"
                        }
                    }
                }, {
                    $project: {
                        sum: 1,
                        _id: 0
                    }
                }, {
                    $limit: 7
                }])
            })
            .then(incomeExpence => {
                // get income and expences details here
                counter = 0;
                incomeExpence.forEach(money => {
                    income[counter] = money.sum;
                    expences[counter] = money.sum - ((money.sum / 100) * 10);
                    profit[counter] = (money.sum / 100) * 10;
                    counter++;
                })

                // find cancelled orders
                return Orders.aggregate([{
                    $unwind: "$orders"
                }, {
                    $match: {
                        "orders.orderStatus": "cancelled"
                    }
                }, {
                    $group: {
                        _id: '$orders.date',
                        sum: {
                            $sum: 1
                        }
                    }
                }, {
                    $project: {
                        sum: 1,
                        _id: 0
                    }
                }, {
                    $limit: 8
                }])

            })
            .then(cancelledOrders => {
                // cancelled orders data here
                counter = 0;
                cancelledOrders.forEach(cancel => {
                    cancelleOrder[counter] = cancel.sum;
                    notCancelledOrder[counter] -= cancel.sum;
                    counter++;
                })
                return Last7Days(7)
            })
            .then(date => {
                date7days = date
                return Last7Days(44)
            })
            .then(date50 => {
                date44 = date50;
                return Orders.aggregate([{
                    $unwind: "$orders"
                }, {
                    $group: {
                        _id: "$orders.date",
                        count: {
                            $sum: "$orders.price"
                        }
                    }
                }, {
                    $limit: 44
                }])
            })
            .then(ordersAl => {
                let flag = false;
                counter = 0;
                ordersAl.forEach(cancel => {
                    orderAll[counter] = cancel.count;
                    counter++;
                    if (counter === ordersAl.length) {
                        res.json({
                            date50: date44,
                            date: date7days,
                            onlinePayment: onlinPayment,
                            cod: cod,
                            cancelleOrder: cancelleOrder,
                            orders: notCancelledOrder,
                            income: income,
                            expences: expences,
                            profit: profit,
                            orderAll: orderAll
                        });
                    }
                })
            })
    }
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
        category: mongoose.Types.ObjectId(req.body.category),
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
        let sellerOrders;
        Orders.aggregate([{
                $match: {
                    sellerId: req.session.sellerId
                }
            }])
            .then(data => {
                sellerOrders = data;
                return Orders.aggregate([{
                    $match: {
                        sellerId: req.session.sellerId
                    }
                }, {
                    $project: {
                        orders: 1,
                        _id: 0
                    }
                }, {
                    $unwind: "$orders"
                }, {
                    $project: {
                        orders: {
                            _id: 0,
                            date: 0,
                            time: 0,
                            userName: 0,
                            userId: 0,
                            orderStatus: 0,
                            paymentMethod: 0,
                            address: 0,
                            price: 0
                        }
                    }
                }, {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id.str",
                        as: "array"
                    }
                }, {
                    $unwind: "$array"
                }, {
                    $project: {
                        orders: {
                            productId: 1
                        },
                        array: {
                            _id: 1
                        }
                    }
                }])
            })
            .then(result => {
                if (sellerOrders) {
                    res.render('seller/show-orders', {
                        user: req.session.sellerLoggedIn ? "true" : "",
                        userType: "seller",
                        categories: categories,
                        orderDetails: sellerOrders[0].orders.reverse()
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

exports.orderDetails = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        let productId = req.query.productId;
        let orderId = req.params.orderId;
        let orderDetails;
        Orders.aggregate([{
                $match: {
                    sellerId: req.session.sellerId
                }
            }, {
                $unwind: "$orders"
            }, {
                $match: {
                    "orders._id": mongoose.Types.ObjectId(orderId)
                }
            }])
            .then(data => {
                orderDetails = data;
                return Product.findById(productId);
            })
            .then(productDetails => {
                if (productDetails) {
                    res.render("seller/order-detaisl", {
                        orderDetails: orderDetails,
                        product: productDetails,
                        errorMessage: "",
                        user: "true",
                        userType: "seller"
                    });
                } else {
                    res.render("seller/order-detaisl", {
                        orderDetails: orderDetails,
                        product: [],
                        errorMessage: "something went wront!",
                        user: "true",
                        userType: "seller"
                    });
                }
            })
            .catch(err => {
                res.render("seller/order-detaisl", {
                    orderDetails: [],
                    product: {},
                    errorMessage: "something went wrong!",
                    user: "true",
                    userType: "seller"
                });
            })
    } else {
        res.redirect("/seller/");
    }
}

// to change the order status through ajax request
exports.changeOrderStatus = (req, res, next) => {
    // save all data coming through ajax request
    const userId = req.body.userId;
    const userOrderId = req.body.userOrderId;
    const orderStatus = req.body.orderStatus;
    const productId = req.body.productId;

    // find order data of seller
    Orders.find({
            sellerId: req.session.sellerId
        })
        .then(result => {
            console.log(result[0].id);
            return Orders.findById(result[0].id)
        })
        .then(data => {
            index = data.orders.findIndex(p => p.userOrderId === userOrderId);
            console.log(index);

            // change the order status from seller's orderlist
            return Orders.updateOne({
                sellerId: req.session.sellerId,
                "orders.userOrderId": userOrderId
            }, {
                $set: {
                    'orders.$.orderStatus': orderStatus
                }
            })
        })
        .then(data => {
            console.log(data);
            res.json("hi");

            // find the user data to change the order status from the embeded data
            return User.find({
                _id: mongoose.Types.ObjectId(userId)
            })
        })
        .then(userDat => {

            // find the array index of this order
            let orderIndex = userDat[0].orders.findIndex(order => {
                return order._id == userOrderId;
            })
            if (orderIndex >= 0) {

                // find the product array index from the product array to change only the specific product's status
                let productIndex = userDat[0].orders[orderIndex].products.findIndex(product => {
                    return product.productId == productId
                })

                // update or change the status of product
                if (productIndex >= 0) {
                    console.log(`product index: ${productIndex}`);
                    return User.findOneAndUpdate({
                        _id: mongoose.Types.ObjectId(userId)
                    }, {
                        [`orders.${orderIndex}.products.${productIndex}.status`]: orderStatus
                    })
                }
            } else {
                console.log('index is -1');
            }
        })
        .then(status => {
            console.log(status)
        })
        .catch(err => {
            console.log(err);
        })
}

exports.salesReport = (req, res, next) => {
    if (req.session.sellerLoggedIn) {
        let data = [];
        Orders.aggregate([{
                $match: {
                    sellerId: req.session.sellerId
                }
            }, {
                $unwind: "$orders"
            }, {
                $project: {
                    orders: 1,
                    _id: 0
                }
            }, {
                $group: {
                    _id: '$orders.date',
                    sum: {
                        $sum: "$orders.price"
                    }
                }
            }, {
                $limit: 30
            }]).then(someData => {
                data = someData;
                return Orders.aggregate([{
                    $match: {
                        sellerId: req.session.sellerId
                    }
                }, {
                    $unwind: "$orders"
                }, {
                    $project: {
                        orders: 1,
                        _id: 0
                    }
                }, {
                    $group: {
                        _id: '$orders.date',
                        sum: {
                            $sum: "$orders.price"
                        }
                    }
                }, {
                    $limit: 30
                }, {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$sum"
                        }
                    }
                }])
            })
            .then(total => {
                res.render("seller/sales-report", {
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "seller",
                    report: data,
                    total: total
                })
            })
    } else {
        res.redirect("/seller/");
    }
}

exports.logout = (req, res, next) => {
    req.session.sellerLoggedIn = false;
    res.redirect("/seller/");
}