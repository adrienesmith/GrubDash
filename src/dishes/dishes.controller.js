//const { create } = require("domain");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// Middleware Functions

function bodyHasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    res.locals.name = name;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name",
  });
}

function bodyHasDescriptionProperty(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    res.locals.description = description;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a description",
  });
}

function bodyHasPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (!Number.isInteger(price) || price <= 0) {
      next({
          status: 400,
          message: "Dish must have a price that is an integer greater than 0",
      });
  }
  if (price && price > 0) {
    res.locals.price = price;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a price",
  });
}

function bodyHasImageUrlProperty(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    res.locals.image_url = image_url;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a image_url",
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    res.locals.dishIdParam = dishId;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function dishIdValidator(req, res, next) {
  const { dishIdParam } = res.locals;
  const { data: { id } = {} } = req.body;
  if (!id || id === dishIdParam){ 
    return next();
  }
  if (id !== dishIdParam){
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishIdParam}`,
    });
  }
  next({
    status: 404,
    message: `Dish id does not exist: ${dishIdParam}`,
  });
}

// Route Handlers

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { name, description, price, image_url } = res.locals;
  const uniqueId = nextId();
  const newDish = {
    id: uniqueId,
    name, 
    description,
    price,
    image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;  
  const originalName = dish.name;
  const originalDescription = dish.description;
  const originalPrice = dish.price;
  const originalImageUrl = dish.image_url;
  const { name, description, price, image_url } = res.locals;
  
  if (originalName !== name) {
    dish.name = name;
  }
  if (originalDescription !== description) {
    dish.description = description;
  }
  if (originalPrice !== price) {
    dish.price = price;
  }
  if (originalImageUrl !== image_url) {
    dish.image_url = image_url;
  }
  
  res.json({ data: dish });
}

module.exports = {
    list, 
    create: [
      bodyHasNameProperty, 
      bodyHasDescriptionProperty, 
      bodyHasPriceProperty, 
      bodyHasImageUrlProperty, 
      create
    ],
    read: [dishExists, read],
    update: [
      dishExists, 
      bodyHasNameProperty, 
      bodyHasDescriptionProperty, 
      bodyHasPriceProperty, 
      bodyHasImageUrlProperty, 
      dishIdValidator, 
      update
    ],
}