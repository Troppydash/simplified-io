function $(selector) {
    return document.querySelector(selector);
}

function waitFor(id, name, callback) {
    let timer = setInterval(function() {
        const ele = document.querySelectorAll(id);
        for (let i = 0; i < ele.length; i++) {
            if (ele[i].className === name) {
                callback(ele[i]);
                clearInterval(timer);
            }
        }
    }, 100);
}

function createIframe(videoId) {
    const container = document.createElement("div");
    container.className = "ytplayer-container";

    const embedded = document.createElement('iframe');
    embedded.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    embedded.className = "ytplayer-video";
    embedded.setAttribute('autoplay', '');

    container.appendChild(embedded);
    return container;
}

waitFor("#info", "style-scope ytd-watch-flexy", function($info) {
    $("#player.style-scope").parentElement.removeChild($("#player.style-scope"));

    // create iframe
    const url = new URL(window.location);
    const videoId = url.searchParams.get("v");
    const video = createIframe(videoId);

    const box = document.createElement("div");
    box.className = "ytplayer";
    box.appendChild(video);
    box.appendChild($info);
    $("#primary-inner").appendChild(box);
});
