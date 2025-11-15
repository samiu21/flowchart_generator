let stream = null;
let videoStarted = false;

const video = document.createElement('video'); // hidden video
video.autoplay = true;

const canvasMain = document.getElementById('canvasMain');
const ctxMain = canvasMain.getContext('2d');

const canvasPreview = document.getElementById('canvasPreview');
const ctxPreview = canvasPreview.getContext('2d');

cv.onRuntimeInitialized = () => {
    console.log("OpenCV.js ready.");
};

// Start Camera
document.getElementById('startBtn').addEventListener('click', async () => {
    try {
        if (!videoStarted) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();

            canvasMain.width = video.videoWidth;
            canvasMain.height = video.videoHeight;
            canvasPreview.width = video.videoWidth;
            canvasPreview.height = video.videoHeight;

            startProcessing(video, canvasMain);

            videoStarted = true;
        }
    } catch (err) {
        console.error("Camera access failed:", err);
        alert("Camera access failed: " + err);
    }
});

// Capture preview (does not save)
document.getElementById('captureBtn').addEventListener('click', () => {
    if (!videoStarted) return alert("Start camera first!");
    ctxPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height);
    ctxPreview.drawImage(canvasMain, 0, 0); // Copy main canvas to preview
});

// Save preview
document.getElementById('saveBtn').addEventListener('click', () => {
    const image = canvasPreview.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = "flowchart_capture.png";
    a.click();
});

// Reset preview canvas
document.getElementById('resetBtn').addEventListener('click', () => {
    ctxPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height);
});

// Main processing loop
function startProcessing(video, canvas) {
    function loop() {
        ctxMain.drawImage(video, 0, 0);
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

        let mv = new cv.MatVector();
        mv.push_back(approx);
        let color = new cv.Scalar(0,255,0,255); // green

        if (approx.rows === 3) {
            cv.drawContours(src, mv, 0, color, 3);
        } else if (approx.rows === 4) {
            cv.drawContours(src, mv, 0, color, 3);
        } else {
            let area = cv.contourArea(cnt);
            let circularity = (4*Math.PI*area)/(peri*peri);
            if (circularity > 0.7) cv.drawContours(src, mv, 0, color, 3);
        }

        approx.delete();
        cnt.delete();
        mv.delete();
    }

    cv.imshow(canvas, src);

    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
}
