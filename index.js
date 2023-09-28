// Function to handle image selection and text recognition
// Function to rotate an image
function rotateImage(imageElement, degrees) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const { width, height } = imageElement;

  // Set the canvas dimensions based on the rotated image dimensions
  if (degrees === 90 || degrees === 270) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // Rotate the image on the canvas
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(imageElement, -width / 2, -height / 2, width, height);

  return canvas.toDataURL('image/jpeg');
}

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
        imgElement.onload = async () => {
          // Check if the image is in portrait orientation
          const isPortrait = imgElement.height > imgElement.width;

          if (isPortrait) {
            // Rotate the image by 90 degrees (counter-clockwise)
            const rotatedImageUrl = rotateImage(imgElement, -90); // Rotate by -90 degrees
            selectedImage.src = rotatedImageUrl;
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

          // Send the image to OCR.space API
          const formData = new FormData();
          formData.append('apikey', 'K83682140088957'); // Replace with your OCR.space API key
          formData.append('language', 'spa'); // Language code (e.g., 'eng' for English)
          formData.append('file', file);
          formData.append('detectOrientation', 'true');
          formData.append('scale', 'true');
          formData.append('OCREngine', '2');
          formData.append('isOverlayRequired', 'true'); // Request JSON response

          try {
            const ocrResponse = await fetch(
              'https://api.ocr.space/parse/image',
              {
                method: 'POST',
                body: formData,
              },
            );

            if (ocrResponse.ok) {
              const ocrData = await ocrResponse.json();

              // Extract and display recognized text
              if (!ocrData.IsErroredOnProcessing) {
                const parsedText = ocrData.ParsedResults[0].ParsedText;
                const linesOverlay = ocrData.ParsedResults[0].TextOverlay.Lines;
                const dniRegex = /(?<!\d)(?:\d{9}-\d|\d{10})(?!\d)/g;
                const dniLine = linesOverlay.find((line) => {
                  if (line.LineText.match(dniRegex)) return line;
                });

                if (dniLine) {
                  // Extract the DNI number from the matched line
                  const dniNumber = dniLine.LineText.match(dniRegex)[0].replace(
                    '-',
                    '',
                  );
                  console.log(dniNumber);
                  const cedulaData = document.querySelector('#cedula');
                  cedulaData.innerText = dniNumber;
                }
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
        };
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
