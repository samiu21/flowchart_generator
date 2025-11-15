cv.onRuntimeInitialized = () => {
    const video = document.getElementById('videoInput');
    const canvas = document.getElementById('canvas');
    const processedCanvas = document.getElementById('processedCanvas');

    const ctx = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();

            video.onplaying = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                processedCanvas.width = video.videoWidth;
                processedCanvas.height = video.videoHeight;

                startProcessing(video, canvas, processedCanvas);
            };
        })
        .catch(err => {
            console.error("Camera error:", err);
            alert("Error accessing camera: " + err);
        });
};

function startProcessing(video, canvas, processedCanvas) {
    const ctx = canvas.getContext('2d');

    function loop() {
        ctx.drawImage(video, 0, 0); // Draw video

        applyOpenCV(canvas, processedCanvas); // Process video frame

        requestAnimationFrame(loop);
    }
    loop();
}

function applyOpenCV(canvas, processedCanvas) {
    const src = cv.imread(canvas);
    const dst = new cv.Mat();

    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.threshold(dst, dst, 120, 255, cv.THRESH_BINARY);

    cv.imshow(processedCanvas, dst);

    src.delete();
    dst.delete();
}

document.getElementById('captureBtn').addEventListener('click', () => {
    const processedCanvas = document.getElementById('processedCanvas');
    const image = processedCanvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = image;
    a.download = "flowchart.png";
    a.click();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    const processedCanvas = document.getElementById('processedCanvas');
    const ctx = processedCanvas.getContext('2d');
    ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
});
