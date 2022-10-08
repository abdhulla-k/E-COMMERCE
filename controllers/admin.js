const Category = require("../models/product_category");

exports.addCategory = (req, res, next) => {
    res.render("admin/add-category", {
        userType: "admin",
        user: ""
    });
}

exports.postSaveCategory = (req, res, next) => {
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