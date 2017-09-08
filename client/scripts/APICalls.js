// ******************************************* Bitcoin *******************************************
function getBitcoinInformation(){
    btcClient.getProductHistoricRates({ start: "2017-09-07T10:00:00.000Z", granularity: 60 }, async function (err, response) {
      if (err) {
        console.log(err);
        return;
      }
     var btcHistoric = await JSON.parse(response.body);
     let total = 0;
     for( var i =0; i< inputTime; i++ ){
     total += (btcHistoric[i][1] + btcHistoric[i][2])/2;
     }
      btcAverage = total/inputTime;
      let firstCandle = btcHistoric[inputTime];
      let startingTime = firstCandle[0];
      let lastCandle = btcHistoric[0];
      let finishTime = lastCandle[0];
      btcTotalTime = (finishTime - startingTime)/60;
    
      let openPrice = (firstCandle[1] + firstCandle[2])/2;
      let closePrice = (lastCandle[1] + lastCandle[2])/2;
    
      btcPercentChange = ((closePrice-openPrice)/closePrice)*100;
      if(btcPercentChange < 0){
        btcColor = "red"
      } else {
        btcColor = "green"
      };
    
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
    
    