const express = require("express");
const customerRouter = express.Router();
const customerController = require("../controllers/customerController");
const vendorController = require("../controllers/vendorController");
const snackController = require("../controllers/snackController");
const orderController = require("../controllers/orderController");
const passport = require("passport");
require("../config/customerPassport")(passport);

// get the available vendors
customerRouter.get("/vendors", async (req, res) =>
  vendorController.getAllVendors(req, res)
);

// get the menu: details of all snacks
customerRouter.get("/menu", async (req, res) =>
  snackController.getAllSnacks(req, res)
);

// get the details of a single snack
customerRouter.get("/menu/:snackId", async (req, res) => {
  snackController.getOneSnack(req, res);
});

// insert an order, specifying the name of the first snack and the assigned
// vendor
customerRouter.post("/:customerId/orders", async (req, res) => {
  if (req.isAuthenticated()) {
    // place order
    if (req.session.userId === req.params.customerId) {
      // current user is authenticated and is requesting their page
      orderController.addOrder(req, res);
    } else {
      // authenticated user, but not the right one
      res.redirect(`/customer/${req.session.userId}/orders`);
    }
  } else {
    // unauthenticated users are redirected to login, then back to cart
    req.session.returnTo = `/customer/cart`;
    res.redirect(`/customer/login`);
  }
});

// Get all the orders for a given customer, the customer must be logged in
// and the requested orders page must be theirs
customerRouter.get("/:customerId/orders", async (req, res) => {
  if (req.isAuthenticated()) {
    if (req.session.userId === req.params.customerId) {
      orderController.getOrdersForOneCustomer(req, res);
    } else {
      res.redirect(`/customer/${req.session.userId}/orders`);
    }
  } else {
    req.session.returnTo = `/customer/cart`;
    res.redirect(`/customer/login`);
  }
});

// redirect unauthenticated customer
// NavBar Check orders
customerRouter.get("/orders", async (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect(`/customer/${req.session.userId}/orders`);
  } else {
    req.session.returnTo = "/orders";
    res.redirect("/customer/login");
  }
});

// get an order detail that belongs to the customer
customerRouter.get(
  "/orders/:orderId",
  snackController.getMenu,
  async (req, res) => orderController.getOneOrder(req, res)
);

// update an order that belongs to the customer
customerRouter.put("/orders/:orderId", async (req, res) =>
  orderController.updateOrder(req, res)
);

// insert new customer
customerRouter.post("/", async (req, res) =>
  customerController.addCustomer(req, res)
);

// get the cart page
customerRouter.get("/cart", snackController.getMenu, async (req, res) => {
  if (req.isAuthenticated()) {
    res.render("cart", {
      menu: req.menu,
      isLoggedin: req.isAuthenticated(),
      customerId: req.session.userId,
    });
  } else {
    res.render("cart", { menu: req.menu, isLoggedin: req.isAuthenticated() });
  }
});

// get the account page, user must be authenticated
customerRouter.get("/account", async (req, res) => {
  if (req.isAuthenticated()) {
    res.render("account", { email: req.session.email });
  } else {
    req.session.returnTo = "/customer/account";
    res.redirect("/customer/login");
  }
});

// login page
customerRouter.get("/login", async (req, res) => res.render("login"));
customerRouter.post(
  "/login",
  passport.authenticate("local-login", {
    successReturnToOrRedirect: "/customer/cart", //redirect to cart after login if success
    failureRedirect: "/customer/login", //redirect to the login page after failed
    failureFlash: true,
  })
);

// signup page
customerRouter.get("/signup", (req, res) => {
  res.render("signup");
});
customerRouter.post(
  "/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/customer/login", //redirect to the login page if sign up succeed
    failureRedirect: "/customer/signup", //redirect to the sign up page if failed
    failureFlash: true,
  })
);

// logout function, users are redirected to login after
customerRouter.post("/logout", function (req, res) {
  req.logout();
  req.flash("");
  res.redirect("/customer/login");
});

module.exports = customerRouter;
