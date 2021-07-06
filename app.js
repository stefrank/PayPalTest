const express = require('express');
const request = require("request");
const path = require('path')
const ejs = require('ejs');
// Import the PayPal SDK package
const paypal = require('@paypal/checkout-server-sdk');
// Import the PayPal SDK client
const payPalClient = require('./paypal.js');
var app = express();

app.set('view engine', 'ejs');//set ejs
app.use(express.static(path.join(__dirname, 'public'))); // exposes public folder.
//app.use('/', IndexRouter);

//index
app.get("/", function (req, res) {
    res.render("index");
});

//success page
app.get("/success", async function handleRequest(req, res) {
    //Get Transaction Details
    const orderID = req.query.orderId;
    let request = new paypal.orders.OrdersGetRequest(orderID);
    let order;
    try {
      order = await payPalClient.client().execute(request);
    } catch (err) {
      //Handle any errors from the call
      console.error(err);
      return res.send(500);
    }
    // Return a successful response to the client
    var data = {
        catpureID: order.result.purchase_units[0].payments.captures[0].id,
        orderID: order.result.id
    };
    res.render("success", data);

});

//fail page
app.get("/fail", function (req, res) {
    res.render("fail");
});

//PayPal Create Order Router
app.get("/createorder", async function createOrder(req, res) {
    // Call PayPal to set up a transaction
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      payer: {
        email_address: req.query.email,
        name: {
          given_name:req.query.firstname,
          surname:req.query.lastname
        },
        phone: {
          phone_type: 'MOBILE',
          phone_number:{
            national_number: req.query.phone
          }
        }
      },
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '3.00',
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: '2.00'
            },
            shipping: {
              currency_code: 'USD',
              value: '1.00'
            }
          }
        },
        items: [
          {
            name: 'iPhone XS',
            description: 'iPhone XS',
            sku: 'sku01',
            unit_amount: {
              'currency_code': 'USD',
              'value': '2.00'
            },
            quantity: '1',
            category: 'PHYSICAL_GOODS'
          }
        ],
        shipping: {
          method: "United States Postal Service",
          address: {
            name: {
              full_name:req.query.firstname,
              surname:req.query.lastname
            },
            address_line_1: req.query.street,
            admin_area_2: req.query.city,
            admin_area_1: req.query.state,
            postal_code: req.query.zip,
            country_code: req.query.country
          }
        }
      }]
    });
  
    let order;
    try {
      order = await payPalClient.client().execute(request);
    } catch (err) {
      // Handle any errors from the call
      console.error(err);
      return res.send(500);
    }
    console.log(order);
    // Return a successful response to the client with the order ID
    res.status(200).json({
      orderID: order.result.id
    });
  
})

app.get("/captureorder", async function handleRequest(req, res) {

  // Get the order ID from the request body
  const orderID = req.query.orderID;
  var captureID;

  // Call PayPal to capture the order
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await payPalClient.client().execute(request);

    //Save capture/Transaction ID
    captureID = capture.result.purchase_units[0]
        .payments.captures[0].id;
    console.log(capture);

  } catch (err) {

    // Handle any errors from the call
    console.error(err);
    return res.send(500);
  }

  // Return capture ID and order ID to the client side
  res.status(200).json({
    captureId: captureID,
    orderId: orderID
  });
})

//Start node server
var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
}); 