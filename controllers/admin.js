const fs = require('fs');
// Build paths
const {
    buildPathHtml,
    buildPathPdf
} = require('../util/build-path');


const Category = require("../models/product_category");
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/orders");
const Coupon = require("../models/coupon");
const Banner = require("../models/banner");

const bcrypt = require("bcryptjs");
const puppeteer = require('puppeteer');

let categories;
let loginErrorMessage;
let couponMessage;

exports.getLogin = (req, res, next) => {
    Category.find({}, (err, data) => {
        if (data) {
            categories = data;
            if (req.session.adminLoggedIn) {
                let categoryData;
                Order.aggregate([{
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

                        return Order.aggregate([{
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
                        res.render("admin/admin-dashboard", {
                            user: req.session.adminLoggedIn ? "true" : "",
                            userType: "admin",
                            categories: categories,
                            route: "/admin-dashboard",
                            categorySales: categoryData,
                            onePercentage: sum[0].sumOfCount / 100
                        });
                    })
                    .catch(err => {
                        req.session.imageNames = [];
                        res.render("admin/admin-dashboard", {
                            user: req.session.adminLoggedIn ? "true" : "",
                            userType: "admin",
                            categories: categories,
                            route: "/admin-dashboard",
                            categorySales: [],
                            sum: 0
                        });
                    })
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

// To share data to admin dashboard
exports.getData = (req, res, next) => {
    console.log('reached');
    if (req.session.adminLoggedIn) {
        let counter = 0;
        let date7days = [];
        let onlinPayment = [0, 0, 0, 0, 0, 0, 0];
        let cod = [0, 0, 0, 0, 0, 0, 0];
        let notCancelledOrder = new Array(44).fill(0);
        let cancelleOrder = new Array(44).fill(0);
        let line = [];
        let date = [];
        let income = [0, 0, 0, 0, 0, 0, 0];
        let expences = [0, 0, 0, 0, 0, 0, 0];
        let profit = new Array(8).fill(0);
        let profitDate = [];
        let todayDate = new Date()
        let year = todayDate.getFullYear()
        let month = todayDate.getMonth()
        let dateOnly = todayDate.getDate();
        let arrayT = new Array(44).fill(0);
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
        Order.aggregate([{
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
                return Order.aggregate([{
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
                return Order.aggregate([{
                    $unwind: "$orders"
                }, {
                    $group: {
                        _id : "$orders.date",
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
                return Order.aggregate([{
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
                return Order.aggregate([{
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

                // get the last 7 days date
                return Last7Days(7)
            })
            .then(date => {
                // console.log("-----------------------income------------------")
                // console.log(income)
                // console.log("-----------------------expence------------------")
                // console.log(expences)
                date7days = date
                return Last7Days(44)
            })
            .then(date50 => {
                console.log("======================cancelled orders==========================");
                console.log(income)
                console.log("======================non cancelled orders==========================");
                console.log(expences)
                res.json({
                    date50: date50,
                    date: date7days,
                    onlinePayment: onlinPayment,
                    cod: cod,
                    cancelleOrder: cancelleOrder,
                    orders: notCancelledOrder,
                    line: line,
                    income: income,
                    expences: expences,
                    profit: profit,
                    profitDate: profitDate
                });
            })
    }
}

exports.showAllOrders = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        try {
            User.aggregate([{
                    $match: {
                        userType: "user"
                    }
                }, {
                    $unwind: "$orders"
                }, {
                    $project: {
                        couponsAppied: 0,
                        address: 0
                    }
                }])
                .then(data => {
                    res.render("admin/all-orders", {
                        orderDetails: data.reverse(),
                        user: "ture",
                        userType: "admin",
                        errorMessage: "",
                    })
                })
                .catch(err => {
                    res.redirect('/admin/');
                })
        } catch {
            res.redirect("/admin/");
        }
    } else {
        res.redirect("/admin/");
    }
}

// sales report
exports.getReport = (req, res, nect) => {
    if (req.session.adminLoggedIn) {
        let NetPrice = 0;
        let data = [];

        Order.aggregate([{
                $unwind: "$orders"
            }, {
                $match: {
                    "orders.orderStatus": "cancelled"
                }
            }, {
                $group: {
                    _id: null,
                    sumPrice: {
                        $sum: "$orders.price"
                    },
                    sellerId: {
                        $first: "$sellerId"
                    },
                    sumQt: {
                        $sum: "sellerId"
                    }
                }
            }])
            .then(data => {
                NetPrice = data[0].sumPrice
                return Order.aggregate([{
                    $unwind: "$orders"
                }, {
                    $match: {
                        "orders.orderStatus": "cancelled"
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
                }])
            })
            .then(data => {
                data = data;

                // render the file and show the report
                res.render("admin/sales-report", {
                    userType: "admin",
                    report: data,
                    total: NetPrice
                });

                //         // create a text file for show the table
                //         const createRow = (item) => `
                //     ${item._id}           Product soled out            ${item.sum}                     ${(item.sum * 10)/100}
                //         `;

                //         // create table headings
                //         const createTable = (rows) => `
                //     Date                 Particular                   Amount                 Profit
                //     -------------------------------------------------------------------------------
                //             ${rows}
                //    -------------------------------------------------------------------------------
                //    Total                                              ${NetPrice}                    ${parseInt(NetPrice - (NetPrice * 90) / 100)}
                //         `;

                //         // create the ejs file and insert table into that
                //         const createHtml = (table) => `
                //             ${table} 
                //         `;

                //         const doesFileExist = (filePath) => {
                //             try {
                //                 fs.statSync(filePath); // get information of the specified file path.
                //                 return true;
                //             } catch (error) {
                //                 return false;
                //             }
                //         };

                //         try {
                //             /* Check if the file for `html` build exists in system or not */
                //             if (doesFileExist(buildPathHtml)) {
                //                 console.log('Deleting old build file');
                //                 /* If the file exists delete the file from system */
                //                 fs.unlinkSync(buildPathHtml);
                //             }
                //             /* generate rows */
                //             const rows = data.map(createRow).join('');
                //             /* generate table */
                //             const table = createTable(rows);
                //             /* generate html */
                //             const html = createHtml(table);
                //             /* write the generated html to file */
                //             fs.writeFileSync(buildPathHtml, html);
                //             console.log('Succesfully created an HTML table');

                //         } catch (error) {
                //             console.log('Error generating table', error);
                //         }
            })
            .then(aggriVal => {
                console.log("===============user orders=================")
            })
    } else {
        res.redirect("/admin/");
    }
}

// download sales report
exports.salesDownload = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        // res.download("./report.txt")
    } else {
        res.redirect("/admin/");
    }
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
                    userData: data,
                    route: 'details',
                    userDataError: ''
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
                    userData: data,
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
                                products: data,
                                userId: userId
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

exports.cancelUserOrder = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        let userData;
        const orderId = req.params.orderId;
        const userId = req.query.userId;
        User.findById(userId)
            .then(data => {
                console.log(data);
                const index = data.orders.findIndex(p => p.id === orderId);
                if (index > -1) {
                    data.orders[index].orderStatus = 'cancelled';
                    data.save()
                        .then(data => {
                            userData = data;
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
                            res.render("admin/user-details", {
                                userType: "admin",
                                user: "",
                                userDetails: userData,
                                route: 'orders'
                            });
                        })
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
                    userDataError: '',
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
        try {
            // sellerId
            const sellerId = req.params.sellerId;

            // get seller data
            User.findById(sellerId, (err, data) => {
                if (err) {
                    console.log(err);
                    res.redirect('/');
                } else {

                    // get order details
                    Order.find({
                        sellerId: sellerId
                    }, (err, result) => {
                        if (!err) {
                            res.render("admin/seller-details", {
                                userType: "admin",
                                user: "",
                                userDetails: data,
                                orders: result[0].orders.reverse(),
                                route: 'orders'
                            });
                        } else {
                            res.render("admin/seller-details", {
                                userType: "admin",
                                user: "",
                                userDetails: data,
                                orders: [],
                                route: 'orders'
                            });
                        }
                    })
                }
            })
        } catch {
            res.redirect("/admin/");
        }

    } else {
        res.redirect("/admin/");
    }
}

exports.showSellerProducts = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const userId = req.params.sellerId;
        let userData;
        User.findById(userId)
            .then(data => {
                userData = data;
                return Product.find({
                    user: userId
                })
            })
            .then(products => {
                console.log(products)
                res.render("admin/seller-details", {
                    userType: "admin",
                    user: "",
                    userDetails: userData,
                    products: products,
                    route: 'products'
                });
            })
        // User.findById(userId,(err, data) => {
        //     if (err) {
        //         console.log(err);
        //         res.redirect('/');
        //     } else {
        //         console.log(data);
        //         userData = data;
        //         Product.find({user: userId}, (err, data) => {
        //             if (err) {
        //                 console.log(err);
        //                 res.redirect('/');
        //             } else {
        //                 console.log(data)
        //                 res.render("admin/seller-details", {
        //                     userType: "admin",
        //                     user: "",
        //                     userDetails: userData,
        //                     products: data,
        //                     route: 'products'
        //                 });
        //             }
        //         })
        //     }
        // })

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

exports.showAllCoupons = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        Coupon.find({}, (err, data) => {
            try {
                if (!err) {
                    if (data) {
                        res.render("admin/coupons", {
                            userType: "admin",
                            user: "",
                            coupons: data
                        });
                    }
                }
            } catch {
                console.log("error found while getting coupons details!");
                res.redirect("/admin/");
            }
        })
    } else {
        res.redirect("/admin/")
    }
}

exports.showAddCoupon = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        res.render("admin/add-new-coupon", {
            userType: "admin",
            user: "",
            message: couponMessage
        });
        couponMessage = ""
    } else {
        res.redirect("/admin/")
    }
}

exports.addCoupon = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const coupon = req.body.couponName;
        const discountPercentage = Number(req.body.percentage);
        const maxDiscount = Number(req.body.maxDiscount);
        const minAmount = Number(req.body.maxAmount);

        Coupon.find({
            coupon: coupon
        }, (err, data) => {
            try {
                if (data.length > 0) {
                    couponMessage = "coupon already exist"
                    res.redirect("/admin/showAddCoupon")
                } else {
                    const newCoupon = new Coupon({
                        coupon: coupon,
                        discountPercentage: discountPercentage,
                        maxDiscount: maxDiscount,
                        minAmount: minAmount
                    })
                    console.log(coupon);
                    newCoupon.save()
                        .then(data => {
                            console.log(data)
                            res.redirect("/admin/showAllCupons")
                        })
                }
            } catch {
                couponMessage = "something wring while adding new category! try again"
                res.redirect("/admin/showAddCoupon")
            }

        })
    } else {
        res.redirect("/admin/")
    }
}

exports.deleteCoupon = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        const couponId = req.params.couponId;
        try {
            Coupon.findByIdAndRemove(couponId)
                .then(data => {
                    console.log(data)
                    console.log("deleted");
                    res.json("deleted")
                })
                .catch(err => {
                    console.log(err);
                    res.redirect("/admin/showAddCoupon")
                })
        } catch {
            console.log("something wrong while removing coupon");
            res.redirect("/admin/showAddCoupon")
        }
    } else {
        res.redirect("/admin/")
    }
}

exports.showBanners = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        Banner.find({}, (err, data) => {
            try {
                if (!err) {
                    if (data) {
                        res.render("admin/banners", {
                            userType: "admin",
                            user: "",
                            bannerData: data
                        });
                    }
                }
            } catch {
                console.log("error found while getting banner details!");
                res.redirect("/admin/");
            }
        })
    } else {
        res.redirect("/admin/");
    }
}

exports.showAddBanner = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        res.render("admin/add-new-banner", {
            userType: "admin",
            user: "",
        });
    } else {
        res.redirect("/admin/");
    }
}

exports.postBanner = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        console.log(req.body);
        console.log(req.files);
        const newBanner = new Banner({
            title: req.body.title,
            description: req.body.description,
            image: req.files[0].filename
        })
        newBanner.save()
            .then(data => {
                console.log(data);
                res.redirect("/admin/showAllBanners");
            })
    } else {
        res.redirect("/admin/");
    }
}

exports.logout = (req, res, next) => {
    req.session.adminLoggedIn = false;
    res.redirect('/admin/');
}