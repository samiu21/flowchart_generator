let stream = null;
let videoStarted = false;

const video = document.createElement('video'); // hidden video element
video.autoplay = true;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

cv.onRuntimeInitialized = () => {
    console.log("OpenCV.js is ready.");
};

// Start camera on button click and capture processed image
document.getElementById('captureBtn').addEventListener('click', async () => {
    try {
        if (!videoStarted) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;

            await video.play();

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            startProcessing(video, canvas);
            videoStarted = true;
        }

        // Capture current processed frame
        const image = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = image;
        a.download = "flowchart.png";
        a.click();
    } catch (err) {
        console.error("Camera error:", err);
        alert("Camera access failed: " + err);
    }
});

// Reset button clears canvas
document.getElementById('resetBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Processing loop: video + OpenCV overlay on same canvas
function startProcessing(video, canvas) {
    function loop() {
        ctx.drawImage(video, 0, 0); // Draw video frame

        // Apply OpenCV processing
        const src = cv.imread(canvas);
        const dst = new cv.Mat();

        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.threshold(dst, dst, 120, 255, cv.THRESH_BINARY);

        cv.imshow(canvas, dst); // Draw processed image back on canvas

        src.delete();
        dst.delete();

        requestAnimationFrame(loop);
    }
    loop();
}
