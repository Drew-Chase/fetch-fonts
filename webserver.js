import express from "express";
import bodyParser from "body-parser";
import {cleanup, generateOutputPath, getDataFromUrl} from "./fetch-fonts.js";

const app = express();

const args = process.argv.slice(2);
const port = args[0] || 80;


app.use(express.static("public"));
app.use(express.urlencoded());
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Generate and download the archive file
app.get("/download", async (req, res) => {
    const tempDirectory = generateOutputPath();
    const url = req.query.url;
    await getDataFromUrl(url, tempDirectory).then((archivePath) => {
        if (archivePath == null) {
            res.redirect("/?error=Invalid%20URL%20or%20No%20Fonts%20Found");
        } else {
            res.status(200);
            res.download(archivePath, "fonts.zip", (err) => {
                if (err) {
                    console.log(err);
                }
                cleanup(archivePath, tempDirectory);
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});