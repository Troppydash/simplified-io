/// Helpers ///
const _sioversion = '0.0.1';

function $(selector) {
    return document.querySelector(selector);
}

function waitFor(id, name, callback) {
    let timer = setInterval(function () {
        const ele = document.querySelectorAll(id);
        for (let i = 0; i < ele.length; i++) {
            if (ele[i].className === name) {
                callback(ele[i]);
                clearInterval(timer);
            }
        }
    }, 50);
}

function setTimeoutUntil(callback, condition) {
    let timer = setInterval(function () {
        if (condition()) {
            callback();
            clearInterval(timer);
        }
    }, 50);
    return timer;
}

// TODO: use the animation frame to make this more efficient
function setIntervalAnimation(callback, condition) {

}


class YoutubePage {
    constructor() {
    }

    destroy() {
    }

    inject() {
    }
}


class YoutubeHomePage extends YoutubePage {
    inject() {
        // add class
        document.body.classList.add('sio-home');
    }

    destroy() {
        // remove class
        document.body.classList.remove('sio-home');
    }
}

class YoutubeSearchPage extends YoutubePage {
    inject() {
        // add class
        document.body.classList.add('sio-search');
    }

    destroy() {
        // remove class
        document.body.classList.remove('sio-search');
    }
}

class YoutubeVideoPage extends YoutubePage {
    constructor() {
        super();

        this.timer = null;
    }

    inject() {
        // add class
        document.body.classList.add('sio-video');

        // move ytd-comments to inside #secondary
        waitFor('ytd-comments#comments', 'style-scope ytd-watch-flexy', () => {
            waitFor('div#secondary-inner', 'style-scope ytd-watch-flexy', () => {
                // find why comments do not show up correct when navigating from another video
                window._stlogger.log("Moving comments");
                const comments = $('ytd-comments#comments');
                // remove from parent
                comments.parentNode.removeChild(comments);

                const columns = $('div#columns > div#secondary');
                while (columns.firstChild) {
                    columns.removeChild(columns.firstChild);
                }
                columns.appendChild(comments);


                // TODO: not removing recommended, but allow playlists

            })
        })

    }

    destroy() {
        // remove class
        document.body.classList.remove('sio-video');

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

class YoutubeChannelVideosPage extends YoutubePage {
    inject() {
        // add class
        document.body.classList.add('sio-channel');

        // resize a bit
        setTimeoutUntil(() => {
            window.dispatchEvent(new Event('resize'));
        }, () => {
            return $('ytd-grid-video-renderer') !== null;
        });

        // this is backup
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 1000);
    }

    destroy() {
        // remove class
        document.body.classList.remove('sio-channel');
    }
}

class YoutubeChannelPage extends YoutubePage {
    inject() {
        // redirect to /c
        // window.location.href = window.location.href.replace('/channel', '/c');
        waitFor('#form', 'style-scope ytd-expandable-tab-renderer', () => {
            const href = document.querySelector('form#form').action;

            // remove /search from href
            window.location.href = href.replace('/search', '/videos');
        });
    }

    destroy() {
    }
}

class YoutubePlaylistPage extends YoutubePage {

}


/// Logger ///
const LoggingLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Logger {
    constructor(level) {
        this.level = level;
    }

    log(message, level = LoggingLevel.DEBUG) {
        if (level >= this.level) {
            console.log(`(Simplified.IO) ${message}`);
        }
    }
}

window._stlogger = new Logger(LoggingLevel.DEBUG);


/// Pages ///
const whitelist = ['account']

// handleNewPage returns a page given an url string, returns null if no matches
function handleNewPage(url) {
    window._stlogger.log(`New page: ${url}`);

    // strip youtube.com/
    url = url.replace('https://www.youtube.com/', '');

    let page = null;
    // match regex
    if (url.match(/^watch.*/)) {
        // video page
        window._stlogger.log('Matched Video page');

        // regex match ?v=id
        const videoId = url.match(/^watch\?v=([^&]+)/)[1];

        page = new YoutubeVideoPage({
            videoId: videoId
        });
    } else if (url.match(/^results.*/)) {
        // search page
        window._stlogger.log('Matched Search page');

        page = new YoutubeSearchPage();
    } else if (url.match(/^playlist?.*/)) {
        // channel page
        window._stlogger.log('Matched Playlist page');

        page = new YoutubePlaylistPage();
    } else if (url.match(/^c\/.*\/videos/)) {
        // channel page
        window._stlogger.log('Matched Channel Vidoes page');

        page = new YoutubeChannelVideosPage();
    } else if (url.match(/^c\/.*/)) {
        // channel page
        window._stlogger.log('Matched Channel page');

        page = new YoutubeChannelPage();
    } else if (url.match(/^channel\/.*/)) {
        // channel page
        window._stlogger.log('Matched Channel page');

        page = new YoutubeChannelPage();
    } else if (url === '') {
        // home page
        window._stlogger.log('Matched Home page');

        page = new YoutubeHomePage();
    } else {
        // unknown page
        window._stlogger.log('Unknown page', LoggingLevel.WARN);

        if (whitelist.includes(url)) {
            return null;
        }
        // reload to home page, force reload
        // remove body
        document.body.innerHTML = '';
        window.location.replace('https://www.youtube.com/');

    }

    return page;
}

// main is the main function that is called when the page is loaded
function _main() {
    window._stlogger.log("Injected Simplified.IO Youtube Script!!!");
    window._stlogger.log("Version: " + _sioversion);

    // pages state
    let currentPage = null;
    let timeout = null;
    const updatePage = (page) => {
        if (currentPage) {
            currentPage.destroy();
        }

        currentPage = page;

        if (page == null) {
            return;
        }
        currentPage.inject();
    }
    const bufferPage = (page) => {
        // TODO: maybe refresh the page too?
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeoutUntil(() => updatePage(page), () => {
            const progress = document.querySelector('yt-page-navigation-progress');
            // check if aria-valuemax = 100
            return progress.getAttribute('aria-valuenow') === '100';
        })
    }

    // urls state
    let lastUrl = window.location.href;
    updatePage(handleNewPage(lastUrl));
    const update = setInterval(() => {
        // check if the url changed
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            bufferPage(handleNewPage(lastUrl));
        }
    }, 50);

    // remove the interval when the page is closed
    window.addEventListener('unload', () => {
        clearInterval(update);
    });

}

// function vec_limit(x, y, c = 1) {
//     if (x * x + y * y > c) {
//         return vec_scale(x, y, c)
//     }
// }

// on page load
window.addEventListener('load', _main);
