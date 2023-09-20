// Function to handle image selection and text recognition
async function recognizeText() {
  const language = document.getElementById('language');
  const selectedLang = language.value;

  const fileInput = document.getElementById('file-1');
  const selectedImage = document.getElementById('selected-image');
  const recognizedText = document.getElementById('recognized-text');
  const recognizeButton = document.getElementById('recognize-button');
  const cedulaData = document.querySelector('#cedula');

  // Disable the recognize button during processing
  recognizeButton.disabled = true;

  // Initialize Tesseract worker with the selected language
  const worker = await Tesseract.createWorker();

  try {
    await worker.load();
    await worker.loadLanguage(selectedLang);
    await worker.initialize(selectedLang);

    // Load FaceAPI.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri(
      'https://rysth.github.io/JS-Tesseract-OCR/models/',
    );
    await faceapi.nets.faceLandmark68Net.loadFromUri(
      'https://rysth.github.io/JS-Tesseract-OCR/models/',
    );
    await faceapi.nets.faceRecognitionNet.loadFromUri(
      'https://rysth.github.io/JS-Tesseract-OCR/models/',
    );
    await faceapi.nets.ssdMobilenetv1.load('https://rysth.github.io/JS-Tesseract-OCR/models/');

    // Handle image selection
    fileInput.addEventListener('change', async (e) => {
      recognizedText.textContent = 'Escaneando, espere porfavor...';
      const file = e.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        selectedImage.src = imageUrl;

        // Create an HTML image element
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        const {
          data: { text },
        } = await worker.recognize(imageUrl);

        const faceDetection = await faceapi
          .detectSingleFace(imgElement)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (faceDetection) {
          const { x, y, width, height } = faceDetection.detection.box;

          // Expand the size of the box to capture more of the face
          const expandedX = Math.max(0, x - 20); // Adjust this value as needed
          const expandedY = Math.max(0, y - 50); // Adjust this value as needed
          const expandedWidth = width + 40; // Adjust this value as needed
          const expandedHeight = height + 80; // Adjust this value as needed

          // Create a canvas and draw the detected face on it
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = expandedWidth;
          canvas.height = expandedHeight;
          ctx.drawImage(
            imgElement,
            expandedX,
            expandedY,
            expandedWidth,
            expandedHeight,
            0,
            0,
            expandedWidth,
            expandedHeight,
          );

          // Convert the canvas content to an image
          const detectedFaceImage = document.getElementById('detected-face');
          detectedFaceImage.src = canvas.toDataURL('image/jpeg'); // You can choose the image format here
          detectedFaceImage.style.display = 'block';
        } else {
          console.log('No face detected.');
          // You can hide or clear the detected face image if needed.
          const detectedFaceImage = document.getElementById('detected-face');
          detectedFaceImage.src = '';
          detectedFaceImage.style.display = 'none'; // Hide the detected face image
        }

        const dniRegex = /(?<!\d)(?:\d{9}-\d|\d{10})(?!\d)/g;
        const dniMatch = text.match(dniRegex);

        if (dniMatch && dniMatch.length > 0) {
          const cleanDniNumber = dniMatch[0].replace('-', '');
          cedulaData.innerText = cleanDniNumber;
        }
        recognizedText.textContent = '¡Hecho!';
      }
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Enable the recognize button after processing
    recognizeButton.disabled = false;
  }
}

// Initialize the recognition process when the page loads
window.addEventListener('DOMContentLoaded', recognizeText);
