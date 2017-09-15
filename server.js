const express = require('express');
const application = express();
const bodyParser = require('body-parser');
const mustache = require('mustache-express');
const session = require('express-session');
const expressValidator = require('express-validator');
const socket = require('socket.io');
var Gdax = require('gdax');
var btcClient = new Gdax.PublicClient();
var ethClient = new Gdax.PublicClient("ETH-USD");
var ltcClient = new Gdax.PublicClient("LTC-USD");

application.set('port', process.env.PORT || 8081)

const server = application.listen(application.get('port'), function () {
    console.log('app starting on port: ', application.get('port'))
});


application.engine('mustache', mustache());

application.set('views', './views');
application.set('view engine', 'mustache');

application.use('/client', express.static(__dirname + '/client'));
application.use(bodyParser.urlencoded({ extended: true }));
application.use(expressValidator());
application.use(session({
  secret: "secretkey",
  saveUninitialized: true,
  resave: false,
}));

var btcTicker;
var btcHistoric;
var btcData;

// ******************************************* API CALLS ******************************************
function getBitcoinInformation() {

  btcClient.getProductHistoricRates({ granularity: 60 }, function (err, response) {
    console.log('err', err);
    if (err) {
      console.log(err);
      return;
    } else {
     var btcHistoric = JSON.parse(response.body);
      if (btcHistoric[0] === undefined) {
        console.log('API Limit Reached.');
        return;
      } else {
        btcData = btcHistoric;
        console.log('Recieved BTC Historic Data');
    }
  }
  });

  btcClient.getProductTicker(function (err, response, data) {
    if (err) {
      console.log(err);
      return;
    }
    btcTicker = data;
    console.log('Recieved BTC Ticker');
  });
};
// ******************************************* API CALLS ******************************************


// ******************************************* React ******************************************
application.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// ******************************************* React ******************************************

// ******************************************* Routes ********************************************
application.get('/', function (request, response) {
  getBitcoinInformation();
  var model = {
    btcTicker: btcTicker,
    btcData: btcData
  }
  response.json({ model });
});
// ******************************************* Routes ********************************************
