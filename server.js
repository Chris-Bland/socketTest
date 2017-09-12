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

application.set('port', process.env.PORT || 3000)

application.listen(application.get('port'), function () {
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

var inputTime = 60;

// ******************************************* Sockets ********************************************
var io = socket(server);
var conditionMet = false;

io.on('connection', function (socket) {
  console.log("Made socket connection")

  socket.on('bitcoin', function (data) {
    inputTime = data.btcTime
    conditionMet = false;

    console.log('Bitcoin Socket Recieved');

    function updateBitcoinInformation() {
      console.log('Updating Bitcoin to Realtime')
      btcPercentChange = ((btcTicker.price - openPrice) / btcTicker.price);
      console.log('btcPercentChange: ', btcPercentChange);
      if (btcPercentChange < 0) {
        btcColor = "red"
      } else {
        btcColor = "green"
      };

      io.sockets.emit('bitcoinUpdate', {
        btcTicker: btcTicker,
        btcTotalTime: inputTime,
        btcAverage: btcAverage,
        btcPercentChange: btcPercentChange
      })
    }
    setInterval(updateBitcoinInformation, 5000);

    function checkConditionMet() {
      getBitcoinInformation();
      console.log("BTC has moved " + (btcPercentChange * 100) + '% in the past ' + data.btcTime + 'minutes');
      console.log('limit set for: ', (data.btcPercent));

         if ((btcPercentChange * 100) >= data.btcPercent) {
           if(conditionMet === true){
             return;
           }else {
           io.sockets.emit('alert', data);
           conditionMet = true;
           }

        console.log('Condition Met: BTC moved ' + btcPercentChange + ' % in the past ' + data.btcTime + ' minutes. Limit set at: ' + data.percent + '.');
      }
    }
    
    setInterval(checkConditionMet, 3000);
  })
})
// ******************************************* Sockets ********************************************


var btcTicker;
var btcHistoric;
var btcAverage;
var btcTotalTime;
var btcPercentChange;
var btcColor;
var openPrice;

getBitcoinInformation();

// ******************************************* API CALLS ******************************************
function getBitcoinInformation() {

  btcClient.getProductHistoricRates({ granularity: 30 }, function (err, response) {
    console.log('err', err);
    if (err) {
      console.log(err);
      return;
    } else {
      console.log('Input Time Duration: ', inputTime);
      var btcHistoric = JSON.parse(response.body);
      console.log('btcHistoric[1]', btcHistoric[1]);

      if (btcHistoric[0] === undefined) {
        console.log('API Limit Reached.');
        return;
      } else {
        let total = 0;
        for (var i = 0; i < (inputTime * 2); i++) {
          total += (btcHistoric[i][1] + btcHistoric[i][2]) / 2;
        }
        btcAverage = total / (inputTime * 2);
        let firstCandle = btcHistoric[(inputTime * 2) - 1];
        openPrice = (firstCandle[1] + firstCandle[2]) / 2;
        console.log('Recieved BTC Historic');
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
  btcPercentChange = ((btcTicker.price - openPrice) / btcTicker.price);
  console.log('btcprcentChange: ', btcPercentChange);
  if (btcPercentChange < 0) {
    btcColor = "red"
  } else {
    btcColor = "green"
  };

  var model = {
    btcTicker: btcTicker,
    btcAverage: btcAverage.toFixed(2),
    btcTotalTime: inputTime,
    btcPercentChange: btcPercentChange.toFixed(2),
    btcColor: btcColor,
  }
  response.json({ model });
});
// ******************************************* Routes ********************************************



