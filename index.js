const { defineComponents, DocumentReaderService } = window.Regula;
window.RegulaDocumentSDK = new DocumentReaderService();

const licenseFile = './license/regula.license';

function convertBinaryToBase64(binaryData) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = btoa(
        String.fromCharCode.apply(null, new Uint8Array(reader.result)),
      );
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(binaryData);
  });
}

// Use the fetch API to load the file's content
fetch(licenseFile)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.blob();
  })
  .then((blob) => convertBinaryToBase64(blob))
  .then((base64) => {
    defineComponents().then(() =>
      window.RegulaDocumentSDK.initialize({
        license: base64,
      }),
    );

    window.RegulaDocumentSDK.recognizerProcessParam = {
      processParam: {
        returnUncroppedImage: true,
        scenario: 'MrzAndLocate',
        multipageProcessing: false,
        returnPackageForReprocess: false,
        timeout: 20000,
        resultTypeOutput: [],
        imageQa: {
          expectedPass: ['dpiThreshold', 'glaresCheck', 'focusCheck'],
          dpiThreshold: 130,
          glaresCheck: true,
          glaresCheckParams: {
            imgMarginPart: 0.05,
            maxGlaringPart: 0.01,
          },
        },
      },
    };

    // Default settings for image processing (From gallery button):
    window.RegulaDocumentSDK.imageProcessParam = {
      processParam: {
        scenario: 'MrzAndLocate',
        returnUncroppedImage: true,
        returnPackageForReprocess: false,
      },
    };
  })
  .catch((error) => {
    console.error('Error loading the file:', error);
  });
