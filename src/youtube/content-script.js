

/// Injector ///
function injectScripts() {
    const script = document.createElement('script');

    script.src = chrome.runtime.getURL('src/youtube/youtube-script.js');

    document.documentElement.appendChild(script);
}

injectScripts();

