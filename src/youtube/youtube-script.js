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
        this.app = null;
    }

    hideAll() {
        if (this.app) {
            this.app.style.opacity = '0';
        }
    }

    showAll() {
        if (this.app) {
            this.app.style.opacity = '1';
        }
    }

    inject() {
        this.app =  document.querySelector('ytd-app');

        // replace all video links of /c/<channel> with /c/<channel>/videos
        const links = document.querySelectorAll('a[href^="/c/"]');
        for (let i = 0; i < links.length; i++) {
            links[i].href += "/videos";
        }
    }

    destroy() {
    }
}


class YoutubeHomePage extends YoutubePage {
    inject() {
        super.inject();
        // add class
        this.hideAll();
        document.body.classList.add('sio-home');
        this.showAll();
    }

    destroy() {
        super.destroy();
        // remove class
        document.body.classList.remove('sio-home');
    }
}

class YoutubeSearchPage extends YoutubePage {
    inject() {
        super.inject();
        // add class
        this.hideAll();
        document.body.classList.add('sio-search');
        this.showAll();
    }

    destroy() {
        super.destroy();

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
        super.inject();

        this.hideAll();

        // add class
        document.body.classList.add('sio-video');
        this.showAll();

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
        super.destroy();

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
        super.inject();

        this.hideAll();
        // add class
        document.body.classList.add('sio-channel');

        this.showAll();
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
        super.destroy();

        // remove class
        document.body.classList.remove('sio-channel');
    }
}

class YoutubeChannelPage extends YoutubePage {
    inject() {
        super.inject();

        // redirect to /c
        // window.location.href = window.location.href.replace('/channel', '/c');
        this.hideAll();

        setTimeoutUntil( () => {
            const href = document.querySelector('form#form').action;

            // remove /search from href
            // remove history
            window.history.replaceState(null, null, href.replace('/search', '/videos'));
            window.location.href = href.replace('/search', '/videos');
        }, () => {
            const href = document.querySelector('form#form');
            if (href == null) {
                return false;
            }
            return href.action.indexOf('/search') !== -1;
        });
    }

    destroy() {
        super.destroy();

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
        let videoId;
        try {
            videoId = url.match(/^watch\?v=([^&]+)/)[1];
        } catch (e) {
            return null;
        }

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
    } else if (url.match(/^(c|channel|user)\/.*\/videos/)) {
        // channel page
        window._stlogger.log('Matched Channel Videos page');

        page = new YoutubeChannelVideosPage();
    } else if (url.match(/^(c|channel|user)\/.*/)) {
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
        // document.body.innerHTML = '';
        // window.location.replace('https://www.youtube.com/');
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
    const updatePage = (page, last) => {
        if (currentPage) {
            currentPage.destroy();
        }

        if (page == null) {
            // navigate to home page
            alert(last)
            window._stlogger.log("Navigating to last url: " + last);
            window.location.href = last;
            return;
        }
        currentPage = page;

        currentPage.inject();
    }

    const bufferPage = (page, last) => {
        // TODO: maybe refresh the page too?
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeoutUntil(() => updatePage(page, last), () => {
            const progress = document.querySelector('yt-page-navigation-progress');
            // check if aria-valuemax = 100
            return progress.getAttribute('aria-valuenow') === '100';
        })
    }

    // urls state

    let lastUrl = window.location.href;
    updatePage(handleNewPage(lastUrl), 'https://www.youtube.com/');
    const update = setInterval(() => {
        // check if the url changed
        if (lastUrl !== window.location.href) {
            const prev = lastUrl;
            lastUrl = window.location.href;
            bufferPage(handleNewPage(lastUrl), prev);
        }
    }, 50);

    // remove the interval when the page is closed
    window.addEventListener('unload', () => {
        clearInterval(update);
    });

}


// on page load
window.addEventListener('load', _main);
