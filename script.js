let stream = null;
let videoStarted = false;

const video = document.createElement('video'); // hidden video element
video.autoplay = true;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

cv.onRuntimeInitialized = () => {
    console.log("OpenCV.js is ready.");
};

// Start Camera
document.getElementById('startBtn').addEventListener('click', async () => {
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
    } catch (err) {
        console.error("Camera error:", err);
        alert("Camera access failed: " + err);
    }
});

// Capture processed frame
document.getElementById('captureBtn').addEventListener('click', () => {
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = "flowchart_capture.png";
    a.click();
});

// Reset canvas
document.getElementById('resetBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Processing loop
function startProcessing(video, canvas) {
    function loop() {
        ctx.drawImage(video, 0, 0); // draw video

        detectShapes(canvas); // detect and highlight shapes

        requestAnimationFrame(loop);
    }
    loop();
}

// Shape detection using OpenCV
function detectShapes(canvas) {
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    // Grayscale + blur + Canny
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 75, 200);

    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
        let cnt = contours.get(i);
        let peri = cv.arcLength(cnt, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.04 * peri, true);

        let color = new cv.Scalar(0, 255, 0, 255); // green

        if (approx.rows === 3) {
            // Triangle
            cv.drawContours(src, new cv.MatVector(approx), -1, color, 3);
        } else if (approx.rows === 4) {
            // Square / Rectangle
            cv.drawContours(src, new cv.MatVector(approx), -1, color, 3);
        } else {
            // Check for circle
            let area = cv.contourArea(cnt);
            let circularity = (4 * Math.PI * area) / (peri * peri);
            if (circularity > 0.7) {
                cv.drawContours(src, new cv.MatVector(approx), -1, color, 3);
            }
        }
        approx.delete();
        cnt.delete();
    }

    cv.imshow(canvas, src);

    // Clean up
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
}
