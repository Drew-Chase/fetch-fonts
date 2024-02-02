# Fetch Fonts

Fetch Fonts is a Node.js application designed to fetch and download fonts from a given URL. It parses CSS to find `@font-face` declarations, downloads the referenced font files, and rewrites the CSS to reference the local copies of the fonts. This can be particularly useful for web developers who want to ensure they have local copies of all fonts used in a project.

## Features

- **Font Downloading**: Downloads font files referenced in CSS from a given URL.
- **CSS Rewriting**: Rewrites CSS `@font-face` declarations to reference the locally downloaded font files.
- **Error Handling**: Gracefully handles errors during the download process.

## Installation

1. Clone the repository: `git clone https://github.com/username/fetch-fonts.git`
2. Navigate into the project directory: `cd fetch-fonts`
3. Install the dependencies: `npm install`

## Usage

Run the script with the URL of the CSS file as an argument:
```bash
node fetch-fonts.js "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100"
```
The script will download the fonts and create a new CSS file in the same directory with the updated `@font-face` declarations.

## Contributing

If you're interested in contributing to Fetch Fonts, please read our contributing guidelines. (Which there are none, so just make a pull request.

## License
This is licensed under GNU General Public License v3.0. For more information, see the [LICENSE](LICENSE) file.
