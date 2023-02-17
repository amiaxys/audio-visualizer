(function () {
  "use strict";
  document.getElementById("start").addEventListener("click", function (e) {
    e.target.disabled = true;
    const canvas = document.getElementById("visualizer");
    const canvasCtx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const audioElmt = document.getElementById("source");
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const distortion = audioCtx.createWaveShaper();
    const source = audioCtx.createMediaElementSource(audioElmt);

    source.connect(analyser);
    analyser.connect(distortion);
    distortion.connect(audioCtx.destination);

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const style = getComputedStyle(document.body);
      canvasCtx.fillStyle = style.getPropertyValue("--color-base");
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = style.getPropertyValue("--color-line");
      canvasCtx.beginPath();
      const sliceWidth = WIDTH / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (HEIGHT / 2);

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      canvasCtx.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx.stroke();
    }
    draw();
    audioElmt.play();
  });
})();
