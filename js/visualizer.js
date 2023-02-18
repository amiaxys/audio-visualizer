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

  let audioCtx;
  let analyser;
  let bufferLength;
  let dataArray;
  let bufferLengthAlt;
  let dataArrayAlt;

  let type = 0;
  let ran;
  let mouse = { x: 0, y: 0 };

  document.addEventListener("keydown", function (e) {
    if (baseColor === style.getPropertyValue("--color-base")) {
      baseColor = style.getPropertyValue("--color-accent");
      lineColor = style.getPropertyValue("--color-bg");
    } else {
      baseColor = style.getPropertyValue("--color-base");
      lineColor = style.getPropertyValue("--color-line");
    }
  });

  canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  function drawWave() {
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
  }

  function drawBars() {
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

  function drawCircles() {
    analyser.getByteFrequencyData(dataArrayAlt);

    canvasCtx.fillStyle = baseColor;
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    let x = 0;
    let radius;
    for (let i = 0; i < bufferLengthAlt; i++) {
      canvasCtx.lineWidth = 2;
      const opacity = Math.floor((255 / Math.max(...ran)) * ran[i]);
      canvasCtx.fillStyle = lineColor + opacity.toString(16);
      canvasCtx.beginPath();
      radius = dataArrayAlt[i] / 3.5;
      canvasCtx.arc(x, ran[i], radius, 0, 2 * Math.PI);
      canvasCtx.fill();
      x += (WIDTH / bufferLengthAlt) * 4;
    }
  }

  function drawGradient() {
    analyser.getByteFrequencyData(dataArrayAlt);

    canvasCtx.fillStyle = baseColor;
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const avg = dataArrayAlt.reduce((a, b) => a + b) / dataArrayAlt.length;
    const radius = avg * 2;

    const dist = Math.sqrt(
      Math.pow(mouse.x - WIDTH / 2, 2) + Math.pow(mouse.y - HEIGHT / 2, 2)
    );

    let x;
    let y;

    if (dist <= radius) {
      x = mouse.x;
      y = mouse.y;
    } else {
      x = mouse.x - WIDTH / 2;
      y = mouse.y - HEIGHT / 2;
      const radians = Math.atan2(y, x);
      x = Math.cos(radians) * radius + WIDTH / 2;
      y = Math.sin(radians) * radius + HEIGHT / 2;
    }

    const gradient = canvasCtx.createRadialGradient(
      x,
      y,
      0,
      WIDTH / 2,
      HEIGHT / 2,
      radius + 2
    );

    gradient.addColorStop(0, lineColor);
    gradient.addColorStop(0.2, lineColor);
    gradient.addColorStop(1, baseColor);

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function draw() {
    requestAnimationFrame(draw);
    switch (type) {
      case 0:
        drawWave();
        break;
      case 1:
        drawBars();
        break;
      case 2:
        drawCircles();
        break;
      case 3:
        drawGradient();
    }
  }

  function setAnalyserAlt(num) {
    analyser.fftSize = num;
    bufferLengthAlt = analyser.frequencyBinCount;
    dataArrayAlt = new Uint8Array(bufferLengthAlt);
  }

  function setAnalyser(num) {
    analyser.fftSize = num;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }

  canvas.addEventListener("click", function (e) {
    switch (type) {
      case 0:
        // for bars
        setAnalyserAlt(256);
        type = 1;
        break;
      case 1:
        // for circles
        setAnalyserAlt(256);
        type = 2;
        ran = Array.from({ length: bufferLengthAlt }, () =>
          Math.floor(Math.random() * (HEIGHT - 100) + 50)
        );
        break;
      case 2:
        // for gradient
        setAnalyserAlt(256);
        type = 3;
        break;
      default:
        // for wave
        setAnalyser(2048);
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

    setAnalyser(2048);

    //canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    draw();
    audioElmt.play();
  });
})();
