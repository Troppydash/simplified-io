// let isFocussing = false;
// let endTime = null;
// let timer = null;
//
// const focusBtn = document.getElementById('btn-focus');
// const focusInput = document.getElementById('input-focus');
// const focusSection = document.getElementById('section-input');
// const timerSection = document.getElementById('section-timer');
// const timerText = document.getElementById('txt-timer');
// const successesText = document.getElementById('txt-success');

// TODO: Make this Work

function SetTotal() {
    chrome.storage.local.get(['successes'], res => {
        if (res.successes == null) {
            chrome.storage.local.set({successes: 0});
            successesText.innerText = 'Successes: 0';
        } else {
            successesText.innerText = `Successes: ${res.successes}`;
        }

    })
}

function NoteStart() {
    chrome.storage.local.set({
        'isFocussing': true
    });
}

function NoteEnd(extra) {
    chrome.storage.local.get(['successes'], res => {
        chrome.storage.local.set({
            'isFocussing': false,
            'successes': +res.successes + extra
        });
        successesText.innerText = `Successes: ${res.successes + extra}`
    })
}

// focusBtn.addEventListener('click', () => {
//     if (!isFocussing) {
//         isFocussing = true;
//
//         const minutes = +focusInput.value;
//         focusInput.value = '';
//
//         focusSection.style.display = 'none';
//         timerSection.style.display = 'block';
//
//         NoteStart();
//         focusBtn.innerText = 'Stop Focusing';
//
//
//         // set timer
//         endTime = Date.now() / 1000 + minutes * 60;
//
//         const frame = () => {
//             if (Date.now() / 1000 > endTime) {
//                 clearInterval(timer);
//                 NoteEnd(1);
//                 focusSection.style.display = 'block';
//                 timerSection.style.display = 'none';
//                 focusBtn.innerText = 'Start Focusing';
//             }
//             const minutes = Math.floor((endTime - Date.now() / 1000) / 60);
//             const seconds = Math.floor((endTime - Date.now() / 1000) % 60);
//             timerText.innerText = `${minutes}:${seconds}`;
//         };
//         frame();
//         timer = setInterval(frame, 500);
//     } else {
//         clearInterval(timer);
//         focusSection.style.display = 'block';
//         timerSection.style.display = 'none';
//         focusBtn.innerText = 'Start Focusing';
//         NoteEnd(0);
//     }
// });
// SetTotal();

function GetLocalDataOrDefault(keys, defaultValues) {
    return new Promise(resolve => {
        chrome.storage.local.get(keys, res => {
            for (let i = 0; i < keys.length; i++) {
                if (res[keys[i]] == null) {
                    SetLocalData(keys[i], defaultValues[i]);
                    res[keys[i]] = defaultValues[i];
                }
            }
            resolve(res);
        })
    });
}

function GetLocalData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, res => {
            if (res[key] == null) {
                reject(`${key} is null`);
            } else {
                resolve(res[key]);
            }
        })
    })
}

function SetLocalData(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({
            [key]: value
        }, () => {
            resolve();
        })
    })
}

function PostMessage(message) {
    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, JSON.stringify(message));
        });
    });
}

async function StartFocussing(newTime) {
    PostMessage({
        type: 'start',
        time: newTime
    });
    await SetLocalData('isFocussing', true);
    await SetLocalData('timerEnd', newTime);
}

async function StopFocussing(success) {
    PostMessage({
        type: 'end',
    });
    await SetLocalData('isFocussing', false);
    await SetLocalData('successes', +await GetLocalData('successes') + success);
    await SetLocalData('timerEnd', -1);
}

// app
async function main() {
    const {
        isFocussing,
        successes,
        timerEnd
    } = await GetLocalDataOrDefault(
        ['isFocussing', 'successes', 'timerEnd'],
        [false, 0, -1]
    );

    const app = new Vue({
        el: '#app',
        data() {
            return {
                isFocussing,
                successes,
                timerEnd,
                durationInput: '5',
                timerInterval: null,
                now: Date.now(),
                nowInterval: null
            }
        },
        computed: {
            timer() {
                if (this.timerEnd === -1) {
                    return '00:00';
                }

                const minutes = Math.floor((this.timerEnd - this.now / 1000) / 60);
                const seconds = Math.floor((this.timerEnd - this.now / 1000) % 60);

                // pad with 0
                return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            },
            buttonText() {
                if (this.isFocussing) {
                    return 'Stop Focusing';
                } else {
                    return 'Start Focusing';
                }
            }
        },
        methods: {
            async start() {
                this.timerEnd = this.now / 1000 + +this.durationInput * 60;
                this.durationInput = '5';
                this.isFocussing = true;
                await StartFocussing(this.timerEnd);
                this.watchTimer();
            },
            async end(success) {
                this.durationInput = '5';
                this.isFocussing = false;
                this.timerEnd = -1;
                await StopFocussing(success);
                this.successes += success;
                clearInterval(this.timerInterval);
            },
            async handleClick() {
                if (this.isFocussing) {
                    await this.end(0);
                } else {
                    await this.start();
                }
            },
            watchTimer() {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }
                const frame = () => {
                    if (this.now / 1000 > this.timerEnd) {
                        clearInterval(this.timerInterval);
                        this.end(1);
                    }
                };
                frame();
                this.timerInterval = setInterval(frame, 100);
            }
        },
        mounted() {
            if (this.isFocussing) {
               this.watchTimer();
            }

            this.nowInterval = setInterval(() => {
                this.now = Date.now();
            }, 500);
        },
        destroyed() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            if (this.nowInterval) {
                clearInterval(this.nowInterval);
            }
        }
    });


}

main();
