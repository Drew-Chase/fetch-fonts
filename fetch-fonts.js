const https = require("https");
const fs = require("fs");
const path = require("path");
const { log } = require("console");

const output = `${__dirname}/out/`;
const url = process.argv[2];
var css;
fs.mkdirSync(output, { recursive: true });

https.get(url, (res) => {
    if (res.statusCode === 200) {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", async () => {
            css = data;
            const regex = /@font-face\s*{\s*font-family:\s*'([^']*)';\s*font-style:\s*([^;]*);\s*font-weight:\s*([^;]*);\s*.*\s*src:\s*url\(([^)]+)\).*\s*}/g;

            let match;
            while ((match = regex.exec(css)) !== null) {
                const fontFamily = match[1];
                const fontStyle = match[2];
                const fontWeight = match[3];
                const srcUrl = match[4];
                const type = srcUrl.split(".").pop();

                let name = `${fontFamily}-${fontStyle}-${fontWeight}.${type}`;
                log(`Downloading ${name}...`);
                await download(srcUrl, path.join(output, name));
                css = css.replace(srcUrl, name);
            }
            fs.writeFileSync(path.join(output, "fonts.css"), css);

        });
    }
});

function download(url, outputPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            res.pipe(fs.createWriteStream(outputPath)).on("finish", resolve).on("error", reject);
        });
    });
}
