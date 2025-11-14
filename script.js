// Wait until OpenCV.js is loaded
cv.onRuntimeInitialized = () => {
    const video = document.getElementById('videoInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Start the camera stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
            video.play();
            
            // Process the frames from the video
            processVideo(video, canvas, ctx);
        })
        .catch(function (err) {
            alert("Error accessing camera: " + err);
        });
};

function processVideo(video, canvas, ctx) {
    // Create a loop to process each frame
    function processFrame() {
        // Set canvas size to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to the canvas
        ctx.drawImage(video, 0, 0);
        
        // Process the image with OpenCV.js
        processImage(canvas);
        
        // Request the next frame
        requestAnimationFrame(processFrame);
    }
    processFrame(); // Start processing
}

function processImage(canvas) {
    const src = cv.imread(canvas); // Read image from canvas
    const dst = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    
    // Apply binary threshold
    cv.threshold(dst, dst, 100, 255, cv.THRESH_BINARY);
    
    // Show the processed image on the canvas
    cv.imshow('canvas', dst);

    // Clean up
    src.delete();
    dst.delete();
}
