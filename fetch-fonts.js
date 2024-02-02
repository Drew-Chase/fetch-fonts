// Require the needed node modules.
const https = require('https');
const fs = require('fs');
const path = require('path');
const {log} = require('console');
const {minify} = require("csso");

// Set some constants - output directory and user agent.
const outputPath = `${__dirname}/out/`;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0';

// Create the output directory if not already exists.
fs.mkdirSync(outputPath, {recursive: true});

/**
 * Retrieves data from a specified URL using a GET request.
 *
 * @param {string} url - The URL from which to retrieve the data.
 * @returns {Promise<any>} - A promise that resolves with the response object if the request is successful, or rejects with an error if the request fails.
 */
function getDataFromUrl(url) {
    // The returned Promise is a way to handle asynchronous operations.
    // It will resolve or reject depending on whether the HTTPS GET request is successful or not.
    return new Promise((resolve, reject) => {

        // Making the HTTPS GET request.
        https.get(url, (res) => {

            // If the HTTP status of the response is 200 (OK), the promise is resolved with the response object.
            // If the status is anything else, the Promise is rejected with a new Error.
            res.statusCode === 200 ? resolve(res) : reject(new Error('Failed to get data from URL'));
        });
    });
}

/**
 * Processes the content of the URL response.
 *
 * @param {http.IncomingMessage} res - The response object received from the URL request.
 * @returns {Promise<void>} - A promise that resolves when the content has been processed.
 */
async function processUrlContent(res) {
    // Defining a variable to hold data from the server response
    let data = "";

    // Listening for 'data' event which is fired whenever a chunk of data is received
    res.on("data", (chunk) => (data += chunk));

    // Listening for 'end' event which is fired when all data has been read and concatenating all chunks of data
    await res.on("end", async () =>
        // Calling parseAndDownloadFonts function which parses the given CSS
        // and downloads fonts specified in the @font-face rules
        parseAndDownloadFonts(data)
    );
}

/**
 * Parses the given CSS and downloads fonts specified in the @font-face rules.
 *
 * @param {string} css - The CSS to parse and extract font information from.
 * @returns {Promise<void>} - A promise that resolves when all fonts have been downloaded and the fonts.css file has been exported.
 */
async function parseAndDownloadFonts(css) {
    // Initialize an object to hold the current font-face value being parsed
    let currentObject = null;

    // Array to store all parsed font-face values
    let fontFaces = [];

    // Split the css into individual lines for parsing
    const lines = css.split('\n');

    // Loop through each line in the split CSS
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // If line contains a font-face declaration, start a new font-face object
        if (line.includes('@font-face')) {
            // If a currentObject exists, then add it to the fontFaces array
            if (currentObject !== null) {
                fontFaces.push(currentObject);
            }

            // Reset currentObject to a new font-face structure
            currentObject = {
                fontFamily: '',
                fontStyle: '',
                fontWeight: '',
                srcUrl: ''
            };
        }
        // If line contains a font-family declaration, set the fontFamily property of the currentObject
        else if (line.includes('font-family:')) {
            currentObject.fontFamily = line.split('\'')[1];
        }
        // If line contains a font-style declaration, set the fontStyle property of the currentObject
        else if (line.includes('font-style:')) {
            currentObject.fontStyle = line.split(':')[1].trim();
        }
        // If line contains a font-weight declaration, set the fontWeight property of the currentObject
        else if (line.includes('font-weight:')) {
            currentObject.fontWeight = line.split(':')[1].trim();
        }
        // If line contains a src declaration, set the srcUrl property of the currentObject
        else if (line.includes('src:')) {
            currentObject.srcUrl = line.split('url(')[1].split(')')[0];
        }
    }

    // After all lines have been processed, if there's a final currentObject, add it to the fontFaces array
    if (currentObject !== null) {
        fontFaces.push(currentObject);
    }

    // Log a message to indicate the font download stage.
    css = buildFontFaceCSS(fontFaces);

    // Log a message to indicate the font download stage.
    log('Downloading fonts...');

    // Loop through each font-face object in the fontFaces array
    for (let i = 0; i < fontFaces.length; i++) {
        const fontFace = fontFaces[i];
        const fontFaceSrc = fontFace.srcUrl;
        const fontFileName = getFontFaceFileName(fontFace);
        const fontFilePath = path.join(outputPath, "fonts", fontFace.fontFamily, fontFileName);

        // Create the font family directory if it doesn't exist
        if (!fs.existsSync(path.join(outputPath, "fonts", fontFace.fontFamily))) {
            fs.mkdirSync(path.join(outputPath, "fonts", fontFace.fontFamily), {recursive: true});
        }

        // Download the font file from the fontFaceSrc URL and save it to the outputPath/fonts directory
        try {
            await download(fontFaceSrc, fontFilePath);
        } catch (e) {
            log(`Failed to download ${fontFileName}:`, e);
        }
    }

    // Log a message to indicate the CSS export stage.
    log('Exporting fonts.css...');

    // Create the css directory if it doesn't exist
    if (!fs.existsSync(path.join(outputPath, "css"))) {
        fs.mkdirSync(path.join(outputPath, "css"), {recursive: true});
    }

    // Write the modified CSS with the local font URLs to a file.
    fs.writeFileSync(path.join(outputPath, "css", "fonts.css"), css);
}

/**
 * Builds CSS for @font-face rule based on the provided font faces.
 *
 * @param {Array} fontFaces - Array of font face objects.
 * @param {string} fontFaces[].fontFamily - The font family name.
 * @param {string} fontFaces[].fontStyle - The font style.
 * @param {string} fontFaces[].fontWeight - The font weight.
 * @param {string} fontFaces[].srcUrl - The URL of the font file.
 * @returns {string} The minified CSS containing the @font-face rules.
 */
function buildFontFaceCSS(fontFaces) {
    // Initialize CSS string
    let css = '';
    // Iterate over the font faces
    for (let i = 0; i < fontFaces.length; i++) {
        // Select the current font face
        const fontFace = fontFaces[i];
        // Fetch the URL from the font-face
        const fontFaceSrc = fontFace.srcUrl;
        // Split the URL into segments
        const fontFaceSrcSplit = fontFaceSrc.split('/');
        // Extract the font file extension from the last segment of the URL
        const fontFileExtension = (fontFaceSrcSplit[fontFaceSrcSplit.length - 1]).split('.')[1];
        // Get the filename of the font face
        const fontFileName = getFontFaceFileName(fontFace);
        // Construct the font path
        const fontFilePath = `../fonts/${fontFace.fontFamily}/${fontFileName}`;
        // Construct the CSS @font-face rule and append it to the CSS string
        css += `@font-face {font-family: '${fontFace.fontFamily}';font-style: ${fontFace.fontStyle};font-weight: ${fontFace.fontWeight};src: url('${fontFilePath}') format('${fontFileExtension}');}\n`;
    }
    // Minify the CSS and return it
    return minify(css).css;
}

/**
 * Downloads a file from the given URL and saves it to the specified output path.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} outputPath - The path where the downloaded file will be saved.
 * @returns {Promise} - A Promise that resolves when the file is successfully downloaded and saved, or rejects with an error.
 */
function download(url, outputPath) {
    // Begins the function by returning a new Promise.
// This Promise takes two parameters: resolve and reject.
    return new Promise((resolve, reject) => {
        // This object literal stores the options for the HTTPS GET request, in this case, the User-Agent header.
        const options = {
            headers: {
                'User-Agent': userAgent
            }
        };
        // The function sends an HTTP GET request with the defined options.
        // The URL for the GET request and the options for the request are passed as parameters.
        https.get(url, options, (res) => {
            // Here we create a writable stream, essentially creating the output file at the specified path.
            const writer = fs.createWriteStream(outputPath);
            // The server response (res) is piped to the write stream (writer).
            // The 'finish' event resolves the Promise, and 'error' event rejects it.
            res.pipe(writer).on('finish', resolve).on('error', reject);
        });
    });
}

/**
 * The function creates a unique font face file name based on the font's properties.
 * The naming convention for the file is: "fontfamily-fontstyle-fontweight.extension".
 * @param {object} fontFace - Object containing properties of a font-face.
 *   @property {string} fontFace.srcUrl - The source URL of the font file.
 *   @property {string} fontFace.fontFamily - The font family name.
 *   @property {string} fontFace.fontStyle - The font style.
 *   @property {string} fontFace.fontWeight - The font weight.
 * @return {string} Returns the file name for the font file, generated based on its properties.
 */
function getFontFaceFileName(fontFace) {
    // Extract the source URL of the font file.
    const fontFaceSrc = fontFace.srcUrl;

    // Split the source URL into components using the slash as a separator
    const fontFaceSrcSplit = fontFaceSrc.split('/');

    // Extract the file extension from the last component of the split source URL
    const fontFileExtension = (fontFaceSrcSplit[fontFaceSrcSplit.length - 1]).split('.')[1];

    // Construct the file name for the font file, using its properties,
    // replacing spaces in fontFamily with nothing,
    // `-` between family, style, and weight, and finally attaching the file extension.
    // Any extraneous semicolons are also removed from the file name to avoid potential file system issues.
    return `${fontFace.fontFamily.replace(/ /g, '')}-${fontFace.fontStyle}-${fontFace.fontWeight}.${fontFileExtension}`.replace(/;/g, '');
}

getDataFromUrl(process.argv[2])
    .then(res => processUrlContent(res))
    .catch(error => log('Failed to download:', error));
