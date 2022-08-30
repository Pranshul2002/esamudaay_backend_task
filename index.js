const express = require("express"); // used to create the restful api
let app = express(); //creating an instance of express
const PORT = process.env.PORT || 4000; //declaring default port for the application
const server = require("http").createServer(app); // creating a http server which will use express for the the api requests
const bodyParser = require("body-parser"); //used to parse the incoming data as json
try {
  app.use(bodyParser.json()); //telling express to use body parser. The incoming request will automatically be formatted as json.
  app.use(bodyParser.urlencoded({ extended: true }));
} catch {
  (e) => {
    console.error(e); //If there is a issue with the json formatting this block will catch it.
    exitHandler();
  };
}
// List of ranges with the value for calculating delivery charges.
let deliveryChargeMap = [
  {
    lower: 0,
    upper: 10,
    value: 5000,
  },
  {
    lower: 10,
    upper: 20,
    value: 10000,
  },
  {
    lower: 20,
    upper: 50,
    value: 50000,
  },
  {
    lower: 50,
    upper: 100,
    value: 100000,
  },
];

//Api endpoint to test if the server is running or not.
app.get("/api/test", (req, res) => {
  return res.status(200).json({
    msg: "Server is running",
  });
});

//Api endpoint to calculate the total order value based on the items ordered, delivery charges and discount offered.
app.post("/api/order", async (req, res) => {
  let orderItems = req.body["order_items"]; //extracting ordered items from the request
  let distance = req.body.distance; //extracting distance from the request
  let offer = req.body.offer; //extracting offer from the request

  //validating ordered items exists
  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({
      success: false,
      msg: "Order Items cannot be empty",
    });
  }

  //validating distance exists and is within the appropriate range
  if (
    !distance ||
    typeof distance != "number" ||
    distance < 0 ||
    distance > 500000
  ) {
    return res.status(400).json({
      success: false,
      msg: "Invalid distance. Out of range.",
    });
  }
  let currPrice = 0; //initializing price

  //iterating over ordered items
  for (let i = 0; i < orderItems.length; i++) {
    let item = orderItems[i];
    let name = item.name; //extracting name
    let quantity = item.quantity; //extracting quantity
    let price = item.price; //extracting price

    //validating name
    if (!name || typeof name != "string") {
      return res.status(400).json({
        success: false,
        msg: "Invalid name",
      });
    }

    //validating quantity
    if (!quantity || typeof quantity != "number" || quantity < 0) {
      return res.status(400).json({
        success: false,
        msg: "Invalid quantity",
      });
    }

    //validating price
    if (!price || typeof price != "number" || price < 0) {
      return res.status(400).json({
        success: false,
        msg: "Invalid price",
      });
    }

    currPrice += price * quantity; //adding cost of each item to the final price
  }

  let deliveryCharge = 0; //initalizing delivery charge

  //iterating over the delivery charge ranges
  for (let i = 0; i < deliveryChargeMap.length; i++) {
    let range = deliveryChargeMap[i];

    //checking if the distance falls under the current range
    if (distance >= range.lower * 1000 && distance <= range.upper * 1000) {
      deliveryCharge = range.value; //setting delivery charge to the value of the matched range
      break;
    }
  }

  let discount = 0; //initializing discount

  //checking if offer exists
  if (offer) {
    let offerType = offer["offer_type"]; //extracting offer type
    let offerValue = offer["offer_val"]; //extracting offer value

    //validating offer type
    if (!offerType || (offerType != "FLAT" && offerType != "DELIVERY")) {
      return res.status(400).json({
        success: false,
        msg: "Invalid offer type",
      });
    }

    //validating offer value
    if (
      offerType === "FLAT" &&
      (!offerValue || typeof offerValue != "number" || offerValue < 0)
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid offer value",
      });
    }

    //calculating discount when offer type is delivery
    if (offerType === "DELIVERY") {
      discount = deliveryCharge;
    } else if (offerType === "FLAT") {
      //calculating discount when offer type is FLAT
      discount =
        currPrice + deliveryCharge > offerValue
          ? offerValue
          : currPrice + deliveryCharge;
    }
  }

  currPrice = currPrice + deliveryCharge - discount; //adding delivery and discount to the final price

  //returning the response
  return res.status(200).json({
    order_total: currPrice,
  });
});

//starting the server at localhost at specified port
server.listen(PORT, "0.0.0.0", () => {
  console.info(`Server up at port ${PORT}`);
});

//error handlers
const exitHandler = () => {};

//error handlers
const unexpectedErrorHandler = (error) => {
  console.error("Unexpected Error " + error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler); //error handlers
process.on("unhandledRejection", unexpectedErrorHandler); //error handlers
