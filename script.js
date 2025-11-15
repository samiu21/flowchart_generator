// Wait until OpenCV.js is loaded
cv.onRuntimeInitialized = () => {
    const video = document.getElementById('videoInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Start the camera stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            console.log("Camera accessed successfully!"); // Log success
            video.srcObject = stream;
            video.play();
            
            // When video is playing, set canvas dimensions
            video.onplaying = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log('Video is playing, canvas dimensions set:', canvas.width, canvas.height);
                processVideo(video, canvas, ctx);
            };
        })
        .catch(function (err) {
            console.error("Error accessing camera:", err); // Log error
            alert("Error accessing camera: " + err);
        });
};

// Process the video feed and display it on canvas
function processVideo(video, canvas, ctx) {
    // Create a loop to process each frame
    function processFrame() {
        // Ensure canvas dimensions match video size
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        
        // Draw the video frame to the canvas
        ctx.drawImage(video, 0, 0);
        
        // Process the image with OpenCV.js
        processImage(canvas);
        
        // Request the next frame
        requestAnimationFrame(processFrame);
    }
    processFrame(); // Start processing
}

// Function to process the canvas image (grayscale + threshold)
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

// Capture image functionality
document.getElementById('captureBtn').addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    const img = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = img;
    link.download = 'flowchart_image.png';
    link.click();
});

// Reset functionality
document.getElementById('resetBtn').addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
});
