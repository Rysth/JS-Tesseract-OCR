const { defineComponents, DocumentReaderService } = window.Regula;
window.RegulaDocumentSDK = new DocumentReaderService();

const licenseFile = './license/regula.license';
let licenseResponse = '';

// Use the fetch API to load the file's content
fetch(licenseFile)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then((fileContent) => {
    licenseResponse = fileContent;
    defineComponents().then(() => {
      window.RegulaDocumentSDK.initialize({ license: licenseResponse });
      console.log(window.RegulaDocumentSDK.params);
    });

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
