// Function to handle image selection and text recognition
async function recognizeText() {
  const language = document.getElementById('language');
  const selectedLang = language.value;

  const fileInput = document.getElementById('file-1');
  const selectedImage = document.getElementById('selected-image');
  const recognizedText = document.getElementById('recognized-text');
  const recognizeButton = document.getElementById('recognize-button');

  // Disable the recognize button during processing
  recognizeButton.disabled = true;

  // Initialize Tesseract worker with the selected language
  const worker = await Tesseract.createWorker();

  try {
    await worker.load();
    await worker.loadLanguage(selectedLang);
    await worker.initialize(selectedLang);

    // Handle image selection
    fileInput.addEventListener('change', async (e) => {
      recognizedText.textContent = 'Escaneando, espere porfavor...';
      const file = e.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        selectedImage.src = imageUrl;

        // Recognize text from the selected image
        const {
          data: { text },
        } = await worker.recognize(imageUrl);
        recognizedText.textContent = text;
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
