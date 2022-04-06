/// Injector ///
function injectStrict(strict, wait=false) {
    const actions = () => {
        if (document.getElementById('#sio-strict')) {
            // remove it
            document.getElementById('#sio-strict').remove();
        }

        const script = document.createElement('script');
        script.id = 'sio-strict';
        // set script content
        script.textContent = `
            window._strict = ${strict}
        `;

        // inject
        document.body.appendChild(script);
    }

    if (wait) {
        document.addEventListener("DOMContentLoaded", function () {
            actions();
        });
    } else {
        actions();
    }
}

// is strict?
function GetLocalDataOrDefault(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, res => {
            if (res[key] == null) {
                resolve(null)
            } else {
                resolve(res[key]);
            }
        })
    })
}

async function main() {
    const value = await GetLocalDataOrDefault('isFocussing');
    if (value === true) {
        injectStrict(true, true);
    }
}

main();


function injectScripts() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/youtube/youtube-script.js');

    document.documentElement.appendChild(script);
}

injectScripts();


chrome.runtime.onMessage.addListener((str) => {
    const message = JSON.parse(str);
    if (message.type === 'start') {
        injectStrict(true);
    } else if (message.type === 'end') {
        injectStrict(false);
    }
})
