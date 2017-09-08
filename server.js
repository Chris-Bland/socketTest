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
const server = application.listen(3000, function () {
  console.log('Listening on port: ', 3000);
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

var inputTime = 60;

// ******************************************* Sockets ********************************************
var conditionMet = false;
var io = socket(server);

io.on('connection', function (socket) {
  console.log("Made socket connection")

  socket.on('bitcoin', function (data) {
    inputTime = data.btcTime
    console.log('Bitcoin Socket Recieved');

    function updateBitcoinInformation() {
      console.log('Updating Bitcoin to Realtime')
      socket.emit('bitcoinUpdate', {
        btcTicker: btcTicker,
        inputTime: inputTime,
        btcAverage: btcAverage,
        btcPercentChange: btcPercentChange
      })
    }
    
    setInterval(updateBitcoinInformation, 5000);

    function checkConditionMet() {
      inputTime = data.btcTime
      getBitcoinInformation();
      console.log("Checking Conditional");
      if (btcPercentChange >= data.btcPercent) {
        io.sockets.emit('bitcoin', data);
        console.log('Condition Met');
        conditionMet = true;
      }
    }

    if (conditionMet === false) {
      setInterval(checkConditionMet, 2000);
    }
  })

})

// ******************************************* Sockets ********************************************

// ******************************************* Bitcoin *******************************************

var btcTicker;
var btcHistoric;
var btcAverage;
var btcTotalTime;
var btcPercentChange;
var btcColor;

function getBitcoinInformation() {
  btcClient.getProductHistoricRates({ start: "2017-09-07T10:00:00.000Z", granularity: 60 }, function (err, response) {
    console.log('err', err);
    if (err) {
      console.log(err);
      return;
    } else {
      console.log('inputTime', inputTime);
      var btcHistoric = JSON.parse(response.body);
      let total = 0;
      for (var i = 0; i < inputTime; i++) {
        total += (btcHistoric[i][1] + btcHistoric[i][2]) / 2;
      }

      btcAverage = total / inputTime;
      let firstCandle = btcHistoric[inputTime];
      let startingTime = firstCandle[0];
      let lastCandle = btcHistoric[0];
      let finishTime = lastCandle[0];
      btcTotalTime = (finishTime - startingTime) / 60;

      let openPrice = (firstCandle[1] + firstCandle[2]) / 2;
      let closePrice = (lastCandle[1] + lastCandle[2]) / 2;

      btcPercentChange = ((closePrice - openPrice) / closePrice) * 100;
      if (btcPercentChange < 0) {
        btcColor = "red"
      } else {
        btcColor = "green"
      };
      console.log('Recieved BTC packet');
    }
  });

  btcClient.getProductTicker(function (err, response, data) {
    if (err) {
      console.log(err);
      return;
    }
    btcTicker = data;
  });
};
// ******************************************* Bitcoin *******************************************

getBitcoinInformation();
// ******************************************* Routes ********************************************
application.get('/', async function (request, response) {
  getBitcoinInformation();
  var model = await {
    btcTicker: btcTicker,
    btcAverage: btcAverage.toFixed(2),
    btcTotalTime: btcTotalTime,
    btcPercentChange: btcPercentChange.toFixed(2),
    btcColor: btcColor,
  }
  response.render("index", model);
});

// ******************************************* Routes ********************************************



