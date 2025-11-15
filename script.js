let stream = null;
let videoStarted = false;

const video = document.createElement('video'); // hidden video
video.autoplay = true;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

cv.onRuntimeInitialized = () => {
    console.log("OpenCV.js ready.");
};

// Start Camera + shape detection
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
        console.error("Camera access failed:", err);
        alert("Camera access failed: " + err);
    }
});

// Capture only when user presses Capture
document.getElementById('captureBtn').addEventListener('click', () => {
    if (!videoStarted) {
        alert("Camera is not started yet!");
        return;
    }
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
        ctx.drawImage(video, 0, 0);

        detectShapes(canvas);

        requestAnimationFrame(loop);
    }
    loop();
}

// Shape detection
function detectShapes(canvas) {
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5,5), 0);
    cv.Canny(blurred, edges, 75, 200);

    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
        let cnt = contours.get(i);
        let peri = cv.arcLength(cnt, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.04 * peri, true);

        // MatVector for drawContours
        let mv = new cv.MatVector();
        mv.push_back(approx);

        let color = new cv.Scalar(0,255,0,255); // green

        if (approx.rows === 3) {
            cv.drawContours(src, mv, 0, color, 3); // triangle
        } else if (approx.rows === 4) {
            cv.drawContours(src, mv, 0, color, 3); // square/rectangle
        } else {
            let area = cv.contourArea(cnt);
            let circularity = (4 * Math.PI * area) / (peri*peri);
            if (circularity > 0.7) {
                cv.drawContours(src, mv, 0, color, 3); // circle
            }
        }

        approx.delete();
        cnt.delete();
        mv.delete();
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
