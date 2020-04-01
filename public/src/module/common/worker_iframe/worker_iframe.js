window.addEventListener('message', function (e) {
  var receiveFromWorker = false;
  var data = JSON.parse(e.data);
  var blob = new Blob([data.code]);
  var worker = new Worker(URL.createObjectURL(blob));
  var timer = null;
  worker.onmessage = function (event) {
    try {
      var eventData = JSON.parse(event.data);
      if (eventData.startTiming) {
        timer = setTimeout(() => {
          worker.terminate();
          if (!receiveFromWorker) {
            console.error('Run script timeout!');
            parent.postMessage(JSON.stringify({
              error: 'Run script timeout!',
              callerId: data.callerId
            }), '*');
          }
        }, 1000);
      } else {
        receiveFromWorker = true;
        clearTimeout(timer);
        parent.postMessage(JSON.stringify({
          data: event.data,
          callerId: data.callerId,
          finished: eventData.finished,
        }), '*');
      }
    } catch (e) {
    }
  };
  worker.onerror = function (err) {
    clearTimeout(timer);
    parent.postMessage(JSON.stringify({
      error: err.message,
      callerId: data.callerId
    }), '*');
  };
  worker.postMessage(data.data);
}, false);
