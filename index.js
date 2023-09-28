// Function to handle image selection and text recognition
async function recognizeText() {
  const fileInput = document.getElementById('file-1');
  const selectedImage = document.getElementById('selected-image');
  const recognizedText = document.getElementById('recognized-text');
  const recognizeButton = document.getElementById('recognize-button');
  const detectedFaceImage = document.getElementById('detected-face');

  // Disable the recognize button during processing
  recognizeButton.disabled = true;

  try {
    // Load FaceAPI.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri('../../models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('../../models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('../../models');
    await faceapi.nets.ssdMobilenetv1.load('../../models');

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

        // Send the image to OCR.space API
        const formData = new FormData();
        formData.append('apikey', 'K83682140088957'); // Replace with your OCR.space API key
        formData.append('language', 'spa'); // Language code (e.g., 'eng' for English)
        formData.append('file', file);

        try {
          const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
          });

          if (ocrResponse.ok) {
            const ocrData = await ocrResponse.json();

            // Extract and display recognized text
            if (!ocrData.IsErroredOnProcessing) {
              const parsedText = ocrData.ParsedResults[0].ParsedText;
              recognizedText.textContent = parsedText;
            } else {
              recognizedText.textContent =
                'OCR processing error: ' + ocrData.ErrorMessage;
            }
          } else {
            recognizedText.textContent =
              'Error communicating with OCR.space API';
          }
        } catch (error) {
          console.error('Error:', error);
        }

        const faceDetection = await faceapi
          .detectSingleFace(imgElement)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (faceDetection) {
          const { x, y, width, height } = faceDetection.detection.box;

          // Expand the size of the box to capture more of the face
          const expandedX = Math.max(0, x - 20);
          const expandedY = Math.max(0, y - 50);
          const expandedWidth = width + 40;
          const expandedHeight = height + 80;

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

          detectedFaceImage.src = canvas.toDataURL('image/jpeg'); // You can choose the image format here
          detectedFaceImage.style.display = 'block';
        } else {
          detectedFaceImage.src = '';
          detectedFaceImage.style.display = 'none'; // Hide the detected face image
        }

        /* const dniRegex = /(?<!\d)(?:\d{9}-\d|\d{10})(?!\d)/g;
        const dniMatch = text.match(dniRegex);

        if (dniMatch && dniMatch.length > 0) {
          const cleanDniNumber = dniMatch[0].replace('-', '');
          cedulaData.innerText = cleanDniNumber;
        } */
        /*  recognizedText.textContent = '¡Hecho!'; */
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
