// Require the needed node modules.
const https = require('https');
const fs = require('fs');
const path = require('path');
const {log} = require('console');

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
    // Define the regular expression to match the @font-face rules in the CSS.
    const regex = /@font-face\s*{\s*font-family:\s*'([^']*)';\s*font-style:\s*([^;]*);\s*font-weight:\s*([^;]*);\s*.*\s*src:\s*url\(([^)]+)\).*\s*}/g;

    let match;

// Execute the regular expression until it finds no more matches.
    while ((match = regex.exec(css)) !== null) {
        // Log the match for debugging purposes
        log(match);

        // Destructure the capture group matches into variables for readability.
        const [fontFamily, fontStyle, fontWeight, srcUrl] = match.slice(1, 5);

        // Determine the font file type from the src URL.
        const type = srcUrl.split('.').pop();

        // Construct a font file name using the font's properties.
        let fontName = `${fontFamily}-${fontStyle}-${fontWeight}.${type}`;

        // Log an informative message to indicate the start of the download.
        log(`Downloading ${fontName}...`);

        try {
            // Attempt to download the font file.
            await download(srcUrl, path.join(outputPath, fontName));
        } catch (e) {
            // Log an error message if download failed.
            log(`Failed to download ${fontName}`);
            log(e);
        }

        // Replace the src URL in the original CSS with the downloaded font file name.
        css = css.replace(srcUrl, fontName);
    }

// Log a message to indicate the CSS export stage.
    log('Exporting fonts.css...');

// Write the modified CSS with the local font URLs to a file.
    fs.writeFileSync(path.join(outputPath, "fonts.css"), css);
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

getDataFromUrl(process.argv[2])
    .then(res => processUrlContent(res))
    .catch(error => log('Failed to download:', error));
