


/// Injector ///
function injectScripts() {
    const script = document.createElement('script');

    script.src = chrome.runtime.getURL('src/youtube/youtube-script.js');

    document.documentElement.appendChild(script);
}


injectScripts();



// document.querySelector('video').pause();
// $("#player.style-scope").parentElement.removeChild($("#player.style-scope"));


//
// function createIframe(videoId) {
//     const container = document.createElement("div");
//     container.className = "ytplayer-container";
//
//     const embedded = document.createElement('iframe');
//     embedded.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
//     embedded.className = "ytplayer-video";
//     embedded.setAttribute('autoplay', '');
//
//     container.appendChild(embedded);
//     return container;
// }
//
//
// waitFor("#info", "style-scope ytd-watch-flexy", function($info) {
//
//     // create iframe
//     // const url = new URL(window.location);
//     // const videoId = url.searchParams.get("v");
//     // const video = createIframe(videoId);
//     //
//     // const box = document.createElement("div");
//     // box.className = "ytplayer";
//     // box.appendChild(video);
//     // box.appendChild($info);
//     // $("#primary-inner").appendChild(box);
//
//     // $("body").className = "sio-video";
// });
//
