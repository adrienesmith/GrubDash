const { create } = require("domain");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyHasNameProperty(req, res, next) {
    const { data: { name } = {} } = req.body;
    if (name) {
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
      return next();
    }
    next({
      status: 400,
      message: "Dish must include a description",
    });
  }

  function bodyHasPriceProperty(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price && price > 0) {
      return next();
    }
    if (price <= 0 || isNaN(price)) {
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0",
        })
    }
    next({
      status: 400,
      message: "Dish must include a price",
    });
  }

  function bodyHasImageUrlProperty(req, res, next) {
    const { data: { image_url } = {} } = req.body;
    if (image_url) {
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
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`,
    });
}

function dishIdMatches(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);  
  const { data: { id } = {} } = req.body;
  if (!id){ 
    res.locals.dish = foundDish;
    return next();
  }
  if (id !== dishId){
    next({
      status: 404,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
}

function list(req, res) {
    res.json({ data: dishes });
}

function post(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        nextId,
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
    const { data: { name, description, price, image_url } = {} } = req.body;
  
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
    post: [bodyHasNameProperty, bodyHasDescriptionProperty, bodyHasPriceProperty, bodyHasImageUrlProperty, post],
    read: [dishExists, read],
    update: [dishExists, update],
}