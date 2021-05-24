// const { create } = require("domain");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// Middleware Functions

function bodyHasDeliverToProperty(req, res, next) {
    const { data: { deliverTo } = {} } = req.body;
    if (deliverTo) {
      res.locals.deliverTo = deliverTo;  
      return next();
    }
    next({
      status: 400,
      message: "Order must include a deliverTo",
    });
}

function bodyHasMobileNumberProperty(req, res, next) {
    const { data: { mobileNumber } = {} } = req.body;
    if (mobileNumber) {
      res.locals.mobileNumber = mobileNumber;  
      return next();
    }
    next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
}

function bodyHasStatusProperty(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (status) {
      res.locals.status = status;  
      return next();
    }
    next({
      status: 400,
      message: "Order must include a status",
    });
}

function bodyHasDishesProperty(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if (dishes) {
      res.locals.dishes = dishes;  
      return next();
    }
    next({
      status: 400,
      message: "Order must include a dish",
    });
}

function statusValidation (req, res, next) {
    const { status } = res.locals;
    const validStatuses = ["pending", "preparing", "out-for-delivery"];
    if (validStatuses.includes(status)){
        return next();
    }
    if (status === "delivered"){
        next({
            status: 400,
            message: "A delivered order cannot be changed",
        });
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    })
}

function dishesValidation (req, res, next) {
    const { dishes } = res.locals;
    if (!Array.isArray(dishes) || dishes.length == 0){
        next({
            status: 400,
            message: "Order must include at least one dish",
          });
    }
    dishes.forEach((dish, index) => {
        if (!dish.quantity || !Number.isInteger(dish.quantity)) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
              });
        }
    });
    next();
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      res.locals.orderIdParam = orderId;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${orderId}.`,
    });
}

function orderIdValidator(req, res, next) {
    const { orderIdParam } = res.locals;
    const { data: { id } = {} } = req.body;
    if (!id || id === orderIdParam){ 
      return next();
    }
    if (id !== orderIdParam){
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderIdParam}`,
      });
    }
    next({
      status: 404,
      message: `Order id does not exist: ${orderIdParam}`,
    });
  }

function isOrderPending(req, res, next) {
    const { status } = res.locals.order;
    if (status === "pending"){
        return next();
    }
    next({
        status: 400,
        message: "An order cannot be deleted unless it is pending",
    });
}

// Route handlers

function list(req, res) {
    res.json({ data: orders });
}

function create(req, res) {
    const { deliverTo, mobileNumber, status, dishes } = res.locals;
    const uniqueId = nextId();
    const newOrder = {
        id: uniqueId,
        deliverTo, 
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function update(req, res) {
    const order = res.locals.order;  
    const originalDeliverTo = order.deliverTo;
    const originalMobileNumber = order.mobileNumber;
    const originalStatus = order.status;
    const originalDishes = order.dishes;
    const { deliverTo, mobileNumber, status, dishes } = res.locals;
  
    if (originalDeliverTo !== deliverTo) {
        order.deliverTo = deliverTo;
    }
    if (originalMobileNumber !== mobileNumber) {
        order.mobileNumber = mobileNumber;
    }
    if (originalStatus !== status) {
        order.status = status;
    }
    if (originalDishes !== dishes) {
        order.dishes = dishes;
    }
  
    res.json({ data: order });
}

function destroy (req, res){
    const { id } = res.locals.order;  
    const index = orders.findIndex((order) => order.id === id);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        bodyHasDeliverToProperty, 
        bodyHasMobileNumberProperty, 
        bodyHasDishesProperty, 
        dishesValidation, 
        create
    ],
    read: [orderExists, read],
    update: [
        orderExists, 
        bodyHasDeliverToProperty, 
        bodyHasMobileNumberProperty, 
        bodyHasStatusProperty, 
        bodyHasDishesProperty,
        orderIdValidator, 
        dishesValidation, 
        statusValidation, 
        update
    ],
    delete: [orderExists, isOrderPending, destroy]
}