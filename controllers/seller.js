const Product = require("../models/product");
let filterKey;

exports.getAddProduct = (req, res, next) => {
    if (req.session.userLoggedIn) {
        res.render("seller/add-products", {
            user: req.session.userLoggedIn ? "true" : "",
            userType: req.session.userType
        });
    } else {
        res.redirect("/");
    }
}

exports.postAddProduct = (req, res, next) => {
    const product = Product({
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        category: req.body.category,
        user: req.session.userId,
    })

    console.log(product);

    product.save()
        .then(result => {

            // save image using express-fileuploader
            let image = req.files.image;
            image.mv("./public/images/" + result.id + '.jpg', (err, done) => {
                if (!err) {
                    res.redirect('/');
                } else {
                    console.log(err);
                }
            })
        })
        .catch(err => {
            console.log(err);
            res.redirect("/");
        })
}

exports.showMyProducts = (req, res, next) => {
    if (req.session.userLoggedIn) {

        if (req.session.filtering === true) {
            req.session.filtering = false;
            Product.find({
                user: req.session.userId,
                category: { $in: [
                    filterKey.menDress,
                    filterKey.womenDress,
                    filterKey.kidsDress,
                    filterKey.electronics,
                    filterKey.mobiles,
                    filterKey.vegitables
                ]}
            }, (err, data) => {
                console.log(data);
                res.render("seller/my-products", {
                    products: data,
                    user: req.session.userLoggedIn ? "true" : "",
                    userType: req.session.userType
                });
            })
        } else {
            // get all products from database
            req.session.filtering = false;
            Product.find({
                user: req.session.userId
            }, (err, data) => {
                res.render("seller/my-products", {
                    products: data,
                    user: req.session.userLoggedIn ? "true" : "",
                    userType: req.session.userType
                });
            })
        }
    } else {
        res.redirect("/");
    }
}

exports.filterProducts = (req, res, next) => {
    if (req.body.all) {
        req.session.filtering = false;
        console.log(false);
        res.redirect("showMyProducts");
    } else {
        req.session.filtering = true;

        filterKey = filterKey = {
            // user: req.session.userId,
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