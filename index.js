async function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const maxWidth = 800; // Set your desired max width
      const maxHeight = 800; // Set your desired max height

      let newWidth = img.width;
      let newHeight = img.height;

      // Check if the image dimensions need to be scaled down
      if (img.width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (img.height * maxWidth) / img.width;
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (img.width * maxHeight) / img.height;
      }

      // Set the canvas dimensions to the scaled size
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw the resized image on the canvas
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert the canvas to a blob
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Function to recognize text from the compressed image
async function recognizeText(compressedImage) {
  const detectedFaceImage = document.getElementById('detected-face');

  try {
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
    await faceapi.nets.ssdMobilenetv1.load(
      'https://rysth.github.io/JS-Tesseract-OCR/models/',
    );

    // Handle image selection
    fileInput.addEventListener('change', async (e) => {
      recognizedText.textContent = 'Escaneando, espere porfavor...';
      const file = e.target.files[0];
      if (file) {
        // Create an HTML image element
        const imgElement = document.createElement('img');

        // Resize the image
        const resizedFile = await resizeImage(file);

        // Set the image element's src attribute to the resized image URL
        imgElement.src = URL.createObjectURL(resizedFile);

        selectedImage.src = imgElement.src;
        imgElement.onload = async () => {
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
    // Create an HTML image element
    const imgElement = document.createElement('img');
    imgElement.src = compressedImage;
    imgElement.onload = async () => {
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

      // Send the compressed image to OCR.space API
      const formData = new FormData();
      formData.append('apikey', 'K83682140088957'); // Replace with your OCR.space API key
      formData.append('language', 'spa'); // Language code (e.g., 'eng' for English)
      formData.append('file', compressedImage);
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');
      formData.append('isOverlayRequired', 'true'); // Request JSON response

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
            const linesOverlay = ocrData.ParsedResults[0].TextOverlay.Lines;
            const dniRegex = /(?<!\d)(?:\d{9}-\d|\d{10})(?!\d)/g;
            console.log();
            const dniLine = linesOverlay.find((line) => {
              if (line.LineText.match(dniRegex)) return line;
            });

            if (dniLine) {
              // Extract the DNI number from the matched line
              const dniNumber = dniLine.LineText.match(dniRegex)[0].replace(
                '-',
                '',
              );
              const cedulaData = document.querySelector('#cedula');
              cedulaData.innerText = dniNumber;
            }

            // Regular expressions to match the desired patterns
            const regex1 = /APELLIDOS Y NOMBRES\s*(\w+)\s*(\w+)/;
            const regex2 = /NOMBRES\s*(\w+)\s*(\w+)/;
            const regex3 = /APELLIDOS\s*(\w+)\s*(\w+)/;

            let extractedNames = [];

            // Try to match each pattern and extract names
            const match1 = parsedText.match(regex1);
            const match2 = parsedText.match(regex2);
            const match3 = parsedText.match(regex3);

            if (match1) {
              extractedNames = [match1[1], match1[2]];
            } else if (match2) {
              extractedNames = [match2[1], match2[2]];
            } else if (match3) {
              extractedNames = [match3[1], match3[2]];
            }

            // Display the extracted names
            if (extractedNames.length === 2) {
              const [surname, givenName] = extractedNames;
              const lastNameData = surname + ' ' + givenName;
              const lastNameText = document.querySelector('#apellidos');
              lastNameText.innerText = lastNameData;

              const indexOfNames = parsedText.indexOf(givenName);
              if (indexOfNames !== -1) {
                const wordsAfterNames = parsedText
                  .substr(indexOfNames + givenName.length)
                  .match(/\w+/g);

                if (wordsAfterNames && wordsAfterNames.length >= 2) {
                  const [word1, word2] = wordsAfterNames.slice(0, 2);
                  const nameData = word1 + ' ' + word2;
                  const nameText = document.querySelector('#nombres');
                  nameText.innerText = nameData;
                } else {
                  console.log('Words after names not found');
                }
              }
            } else {
              console.log('Names not found');
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
  } catch (error) {
    console.error('Error:', error);
  }
}

// Initialize the recognition process when the page loads
window.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-1');
  fileInput.addEventListener('change', handleImageUpload);
});
