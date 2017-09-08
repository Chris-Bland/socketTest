var socket = io.connect('localhost:3000');

//Query DOM
var btcPercent = document.getElementById('btcPercent');
    btcTime = document.getElementById('btcTime');
    button = document.getElementById('send');
    output = document.getElementById('output');
    btcLastTraded = document.getElementById('btcLastTraded');
    btcMovementPeriod = document.getElementById('btcMovementPeriod');
    btcAverage = document.getElementById('btcAverage');
    btcMovementPercentage = document.getElementById('btcMovementPercentage');



//emit event
button.addEventListener('click', function () {
  output.style.backgroundColor = "red";
  socket.emit('bitcoin', {
    btcPercent: btcPercent.value,
    btcTime: btcTime.value
  })
})

//listen for events
socket.on('bitcoin', function (data) {
  output.innerHTML = "Condition Met!";
  output.style.backgroundColor = "green";
  window.alert("CONDITION MET");
})

socket.on('bitcoinUpdate', function (data) {
    btcLastTraded.innerHTML = "Last Traded Price: " + data.btcTicker.price;
    btcMovementPeriod.innerHTML = "Movement Period Watched: " + data.inputTime + " minutes";
    btcAverage.innerHTML = "Average Moving Price: " + data.btcAverage.toFixed(2);
    btcMovementPercentage.innerHTML = "Bitcoin has moved: " + data.btcPercentChange.toFixed(2) + "%";
})


