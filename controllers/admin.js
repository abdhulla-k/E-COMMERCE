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
                req.session.imageNames = [];
                res.render("admin/admin-dashboard", {
                    user: req.session.sellerLoggedIn ? "true" : "",
                    userType: "admin",
                    categories: categories,
                    route: "/admin-dashboard"
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

// To share data to admin dashboard
exports.getData = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        let allOrders = [];
        let cancelleOrder = [];
        let line = [];
        let date = [];
        let income = [];
        let expences = [];
        let profit = [];
        let profitDate = [];
        let todayDate = new Date()
        let year = todayDate.getFullYear()
        let month = todayDate.getMonth()
        let dateOnly = todayDate.getDate();

        Order.aggregate([{
                $unwind: "$orders"
            }, {
                $group: {
                    _id: '$orders.date',
                    count: {
                        $sum: 1
                    }
                }
            }, {
                $project: {
                    count: 1,
                    _id: 0
                }
            }, {
                $limit: 6
            }])
            .then(data => {
                data.forEach(a => {
                    allOrders.push(a.count)
                })
                return Order.aggregate([{
                    $unwind: "$orders"
                }, {
                    $match: {
                        "orders.orderStatus": "cancelled"
                    }
                }, {
                    $group: {
                        _id: '$orders.date',
                        count: {
                            $sum: 1
                        }
                    }
                }, {
                    $project: {
                        count: 1,
                        _id: 0
                    }
                }, {
                    $limit: 6
                }])
            })
            .then(cancelledOrders => {
                let index = 0;
                cancelledOrders.forEach(a => {
                    // calculate the existing orders
                    cancelleOrder.push(a.count);
                    line.push(allOrders[index] - a.count);

                    // calculate last 5 days date
                    date.push(`${dateOnly - index}-${month}-${year}`);
                    index++;
                })

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
                    $limit: 4
                }])
            })
            .then(incomeExpence => {
                incomeExpence.forEach(money => {
                    income.push(money.sum);
                    expences.push(money.sum - ((money.sum / 100) * 10))
                })

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
                    $limit: 8
                }])

            })
            .then(profitData => {
                index = 0;
                profitData.forEach(prfi => {
                    profit.push((prfi.sum / 100) * 10);

                    profitDate.push(`${dateOnly - index}-${month}-${year}`);
                    index++;
                })

                // reverse all data arrays
                allOrders.reverse();
                cancelleOrder.reverse();
                date.reverse();
                line.reverse();
                income.reverse();
                expences.reverse();
                profitDate.reverse();
                profit.reverse();

                // give response
                res.json({
                    cancelleOrder: cancelleOrder,
                    orders: allOrders,
                    line: line,
                    date: date,
                    income: income,
                    expences: expences,
                    profit: profit,
                    profitDate: profitDate
                });
            })
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