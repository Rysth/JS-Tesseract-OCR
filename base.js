function base64ToBytes(base64) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

// Examples
bytesToBase64(new TextEncoder().encode('a Ā 𐀀 文 🦄')); // "YSDEgCDwkICAIOaWhyDwn6aE"
new TextDecoder().decode(base64ToBytes('YSDEgCDwkICAIOaWhyDwn6aE')); // "a Ā 𐀀 文 🦄"

const licenseFile = './license/regula.license';

// Use the fetch API to load the file's content
fetch(licenseFile)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then((fileContent) => {
    const licenseKey = bytesToBase64(new TextEncoder().encode(fileContent));
  })
  .catch((error) => {
    console.error('Error loading the file:', error);
  });
