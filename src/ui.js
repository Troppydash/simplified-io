let isFocussing = false;
let endTime = null;
let timer = null;

const focusBtn = document.getElementById('btn-focus');
const focusInput = document.getElementById('input-focus');
const focusSection = document.getElementById('section-input');
const timerSection = document.getElementById('section-timer');
const timerText = document.getElementById('txt-timer');
const successesText = document.getElementById('txt-success');

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

focusBtn.addEventListener('click', () => {
    if (!isFocussing) {
        isFocussing = true;

        const minutes = +focusInput.value;
        focusInput.value = '';

        focusSection.style.display = 'none';
        timerSection.style.display = 'block';

        NoteStart();
        focusBtn.innerText = 'Stop Focusing';


        // set timer
        endTime = Date.now() / 1000 + minutes * 60;

        const frame = () => {
            if (Date.now() / 1000 > endTime) {
                clearInterval(timer);
                NoteEnd(1);
                focusSection.style.display = 'block';
                timerSection.style.display = 'none';
                focusBtn.innerText = 'Start Focusing';
            }
            const minutes = Math.floor((endTime - Date.now() / 1000) / 60);
            const seconds = Math.floor((endTime - Date.now() / 1000) % 60);
            timerText.innerText = `${minutes}:${seconds}`;
        };
        frame();
        timer = setInterval(frame, 500);
    } else {
        clearInterval(timer);
        focusSection.style.display = 'block';
        timerSection.style.display = 'none';
        focusBtn.innerText = 'Start Focusing';
        NoteEnd(0);
    }
});


SetTotal();
