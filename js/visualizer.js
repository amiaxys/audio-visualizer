(function () {
  "use strict";
  const style = getComputedStyle(document.body);
  let baseColor = style.getPropertyValue("--color-base");
  let lineColor = style.getPropertyValue("--color-line");

  const canvas = document.getElementById("visualizer");
  const canvasCtx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const audioElmt = document.getElementById("source");

  const fftSize = 2048;

  let audioCtx;
  let analyser;
  let bufferLength;
  let dataArray;
  let bufferLengthAlt;
  let dataArrayAlt;
  let type = 0;

  canvas.addEventListener("mouseenter", function (e) {
    baseColor = style.getPropertyValue("--color-accent");
    lineColor = style.getPropertyValue("--color-bg");
  });

  canvas.addEventListener("mouseleave", function (e) {
    baseColor = style.getPropertyValue("--color-base");
    lineColor = style.getPropertyValue("--color-line");
  });

  function draw() {
    requestAnimationFrame(draw);
    if (type === 0) {
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = baseColor;
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = lineColor;
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

    } else if (type === 1) {
      analyser.getByteFrequencyData(dataArrayAlt);

      canvasCtx.fillStyle = baseColor;
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLengthAlt; i++) {
        barHeight = dataArrayAlt[i] + 2;

        canvasCtx.fillStyle = lineColor;
        canvasCtx.fillRect(x, HEIGHT / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 2;
      }
    }
  }

  canvas.addEventListener("click", function (e) {
    if (type === 0) {
      // for bars
      analyser.fftSize = 256;
      bufferLengthAlt = analyser.frequencyBinCount;
      dataArrayAlt = new Uint8Array(bufferLengthAlt);
      type = 1;
    } else {
      // for wave
      analyser.fftSize = fftSize;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      type = 0;
    }
    draw();
  });

  document.getElementById("start").addEventListener("click", function (e) {
    e.target.disabled = true;

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    const distortion = audioCtx.createWaveShaper();
    const source = audioCtx.createMediaElementSource(audioElmt);

    source.connect(analyser);
    analyser.connect(distortion);
    distortion.connect(audioCtx.destination);

    analyser.fftSize = fftSize; // must be power of 2
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    //canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    draw();
    audioElmt.play();
  });
})();
