// let theCanvas = document.getElementById("theCanvas");
// let canvasContext = theCanvas.getContext("2d");

// Reference for Web Serial material: https://web.dev/serial/
// Reference for Readable Stream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader

let randomTones = [
    "E", "F", "G", "H", "A"
];

let startButton = document.getElementById("start");
let playButton = document.getElementById("write");
let tune = document.getElementById("tune");
let allTunes = document.getElementById("gameTunes");

let randTune;
let connection;
let microValue = 0;
let characterMove = false;

//let time = 60;
//let maxTime = 60;
let totalGuessed = 0;

//let timeInterval = 0;
let choiceTimer = 0;


let answer1 = document.getElementById("answer1");
let answer2 = document.getElementById("answer2");
let answer3 = document.getElementById("answer3");
let answer4 = document.getElementById("answer4");

let theAnswers = [answer1, answer2, answer3, answer4];

let userArrow = document.getElementById("player"); 


async function connectMicrobit() {
    connection = await navigator.serial.requestPort();
    await connection.open({ baudRate: 115200 });
}

async function writeData() {
    if (connection)
    {
        const play = connection.writable.getWriter();
        let setPlay = new Uint8Array([115, 44]); //send "s" with , as seperator to start micro:bit code
        await play.write(setPlay);

        play.releaseLock();
    }
    else {
        alert("Ensure your Micro:bit is connected!");
    }
}

function readData() {
    
    // Reference for Readable Stream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader
    const readTunes = connection.readable.getReader();
    readTunes.read().then(function assignTune({done, value}) {

        microValue = "";

        if (done) {
            return;
        }

        microValue = new TextDecoder().decode(value);
        if (!isNaN(microValue))
            theAnswers[microValue].classList.add("correct");

        console.log(microValue);

        return readTunes.read().then(assignTune);
    });
}

function gameFunctions() {

    for (let i = 0; i < 4; i++) {
        if (document.getElementById("answer" + (i + 1)).classList.contains("correct")) {
            document.getElementById("answer" + (i + 1)).classList.remove("correct");
        }
    }

    writeData();
    //fetchStream();
    //readData();

    document.getElementById("overlay").style.display = "none";
    document.getElementById("overlay").style.opacity = 0;
    document.getElementById("allAnswers").style.display = "none";
    document.getElementById("correctMessage").style.display = "none";
    document.getElementById("gameTunes").style.display = "none";
    document.getElementById("guessTune").style.display = "none";
    document.getElementById("tune").style.display = "block";

    setTimeout(() => {
        document.getElementById("tune").style.display = "none";
        document.getElementById("gameTunes").style.display = "block";
        readData();
    }, 8000)

    setTimeout(() => {
        document.getElementById("allAnswers").style.display = "grid";
        document.getElementById("gameTunes").style.display = "none";
        document.getElementById("guessTune").style.display = "grid";
        
        choiceTimer = setInterval(handleChoice, 1000);
        //timeInterval = setInterval(handleTime, 1000);
        
    }, 18000)

        
    
}

function handleChoice() {
    switch (microValue) {
        case "a":
            performHighlightAnimation(0);
            userArrow.style.transform = "rotate(-45deg)";
            break;
        case "b":
            performHighlightAnimation(1);
            userArrow.style.transform = "rotate(45deg)";
            break;
        case "c":
            performHighlightAnimation(2);
            userArrow.style.transform = "rotate(225deg)";
            break;
        case "d":
            performHighlightAnimation(3);
            userArrow.style.transform = "rotate(135deg)";
            break;
        case "#":
            makeSelection();
            break;
        default:
            break;
    }
}

// function handleTime() {
//     time--;
//     document.getElementById("timeLeft").innerText = time;
// }

function performHighlightAnimation(num) {
    for (let i = 0; i < theAnswers.length; i++) {
        if (i != num) {
            if (theAnswers[i].classList.contains("selected")) {
                theAnswers[i].classList.remove("selected"); 
            }
        }
    }

    theAnswers[num].classList.add("selected");
}

function makeSelection() {
    let userChoice;
    clearInterval(choiceTimer);
    //clearInterval(timeInterval);
    for (let i = 0; i < theAnswers.length; i++) {
        if (theAnswers[i].classList.contains("selected")) {
            userChoice = theAnswers[i];
        }
    }

    if (userChoice.id == "answer1") {
        userArrow.style.transform = "rotate(-45deg) translateY(-100px)";
    }
    else if (userChoice.id == "answer2") {
        userArrow.style.transform = "rotate(45deg) translateY(-100px)";
    }
    else if (userChoice.id == "answer3") {
        userArrow.style.transform = "rotate(225deg) translateY(-100px)";
    }
    else if (userChoice.id == "answer4") {
        userArrow.style.transform = "rotate(135deg) translateY(-100px)"; 
    }

    setTimeout(showResults, 2000);

    if (userChoice.classList.contains("correct")) {
        document.getElementById("correctMessage").style.display = "unset";
        totalGuessed++;
        document.getElementById("tunesGuessed").innerText = totalGuessed;

        // if (maxTime > 15) {
        //     maxTime = maxTime - 2;
        // }

        // time = maxTime;
        setTimeout(gameFunctions, 6000);
    }
    else {
        document.getElementById("incorrectMessage").style.display = "unset";
        // maxTime = 60;
        // time = 60;
        setTimeout(() => {
            startButton.style.display = "block";
            playButton.style.display = "block";
            document.getElementById("gameInstructions").style.display = "block";
            document.getElementById("overlay").style.display = "none";
            document.getElementById("overlay").style.opacity = 0;
            document.getElementById("allAnswers").style.display = "none";
            document.getElementById("incorrectMessage").style.display = "none";
            document.getElementById("gameTunes").style.display = "none";
            document.getElementById("guessTune").style.display = "none";
            document.getElementById("tune").style.display = "none";
        }, 6000);
    }
}

function showResults() {
    document.getElementById("overlay").style.opacity = 1;
    document.getElementById("overlay").style.display = "unset";
}


startButton.addEventListener("click", () => {
    connectMicrobit();
    playButton.style.display = "block";
});

playButton.addEventListener("click", () => {
    if (connection) {
        totalGuessed = 0;
        document.getElementById("tunesGuessed").innerText = 0;
        //document.getElementById("timeLeft").innerText = 60;
        gameFunctions();
        startButton.style.display = "none";
        playButton.style.display = "none"; 
        document.getElementById("gameInstructions").style.display = "none";
    }
    else {
        alert("Ensure your Micro:bit is connected!")
    }
    
});

