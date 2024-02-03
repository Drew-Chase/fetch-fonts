document.querySelector("#search-input").addEventListener("submit", async e => {
    const search = encodeURIComponent(document.querySelector("#search-input input").value);
    window.location.href = `/download?url=${search}`;
    document.querySelector("#search-input input").value = "";
})

document.querySelector("input#search").addEventListener("focusin", async e => {
    try {

        const clipboard = await navigator.clipboard.readText();
        const input = e.target;
        console.log(clipboard)
        if (clipboard.startsWith("https://fonts.googleapis.com/css2?family=")) {
            input.value = clipboard;
        }
    } catch {
        console.log(`Clipboard access is not supported in your browser.`)
    }
})

if (window.location.search.includes("error")) {
    document.querySelector("#error").innerText = decodeURIComponent(window.location.search.split("error=")[1]);
    window.history.pushState({}, document.title, "/")
}