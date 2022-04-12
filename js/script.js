// Reference for Web Serial connection, writing to serial port, and textDecoder: https://web.dev/serial/
// Reference for Readable Stream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader

//button elements for the guess the notes game
let connectButton = document.getElementById("connectMicro");
let playButton = document.getElementById("playGame");

//values for the serial connection to the micro:bit
let connection;
let microValue = 0;

//game timer and score values
let time = 60;
let maxTime = 60;
let totalGuessed = 0;

//interval values
let timeInterval = 0;
let choiceTimer = 0;


//answer card elements
let answer1 = document.getElementById("answer1");
let answer2 = document.getElementById("answer2");
let answer3 = document.getElementById("answer3");
let answer4 = document.getElementById("answer4");

//array of all the answers on the HTML page
let theAnswers = [answer1, answer2, answer3, answer4];

//userArrow element that the player will control
let userArrow = document.getElementById("player"); 

// Reference for Web Serial connection, writing to serial port, and textDecoder: https://web.dev/serial/
//function to connect to the micro:bit serial port
async function connectMicrobit() {
    connection = await navigator.serial.requestPort();
    await connection.open({ baudRate: 115200 }); //use baud rate of 115200 for micro:bit
}

// Reference for Web Serial connection, writing to serial port, and textDecoder: https://web.dev/serial/
//function to send data to the micro:bit
async function signalGameStart() {
    //if there is a serial port connection
    if (connection)
    {
        //get the writer for the serial port
        const play = connection.writable.getWriter();
        let setPlay = new Uint8Array([115, 44]); //send "s" with , as seperator to start micro:bit code
        //write to the micro:bit to start the sound game
        await play.write(setPlay);

        //release the writer stream
        play.releaseLock();
    }
    else {
        //alert the user that nothing is connected to the serial port
        alert("Ensure your Micro:bit is connected!");
    }
}

// Reference for Web Serial connection, writing to serial port, and textDecoder: https://web.dev/serial/
//function to read data from the micro:bit
function readSoundGameInfo() {
    
    // Reference for Readable Stream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader
    //get the reader for the serial port
    const readTunes = connection.readable.getReader();
    //read the value from the micro:bit
    readTunes.read().then(function assignTune({done, value}) {

        //reset microValue
        microValue = "";

        //if the value has been fully read
        if (done) {
            //exit the read function
            return;
        }

        //decode the value into a number / string for use with the game
        microValue = new TextDecoder().decode(value);

        //if microValue is a number
        if (!isNaN(microValue))
            theAnswers[microValue].classList.add("correct"); //add the correct class to the corresponding answer HTML card

        //get more data from the micro:bit
        return readTunes.read().then(assignTune);
    });
}

//function to handle the game interactions
function gameFunctions() {

    //remove the correct class from all answer HTML cards from previous rounds
    for (let i = 0; i < 4; i++) {
        if (document.getElementById("answer" + (i + 1)).classList.contains("correct")) {
            document.getElementById("answer" + (i + 1)).classList.remove("correct");
        }
    }

    //send data to the micro:bit to start the game
    signalGameStart();

    //hid the game board and overlays
    document.getElementById("overlay").style.display = "none";
    document.getElementById("overlay").style.opacity = 0;
    document.getElementById("allAnswers").style.display = "none";
    document.getElementById("correctMessage").style.display = "none";
    document.getElementById("titleInstructionTwo").style.display = "none";
    document.getElementById("gameInfo").style.display = "none";

    //show the first instruction
    document.getElementById("titleInstructionOne").style.display = "block";

    //once 8 seconds have passed
    setTimeout(() => {
        //hide the first instruction and show the second instruction
        document.getElementById("titleInstructionOne").style.display = "none";
        document.getElementById("titleInstructionTwo").style.display = "block";

        //get the game data from the micro:bit
        readSoundGameInfo();
    }, 8000)

    //once 18 seconds have passed
    setTimeout(() => {
        //hide the second instruction
        document.getElementById("titleInstructionTwo").style.display = "none";

        //show the game board, score, and title
        document.getElementById("allAnswers").style.display = "grid";
        document.getElementById("gameInfo").style.display = "grid";
        
        //set the interval for updating the user choice
        choiceTimer = setInterval(handleChoice, 1000);

        //set the interval for updating the game timer
        timeInterval = setInterval(handleTime, 1000);
        
    }, 18000)

        
    
}

//function to handle the player choice
function handleChoice() {
    //check the answer string the compass data from the micro:bit is returning
    switch (microValue) {
        case "a":
            //highlight the first answer and have the user arrow point towards it
            performHighlightAnimation(0);
            userArrow.style.transform = "rotate(-45deg)";
            break;
        case "b":
            //highlight the second answer and have the user arrow point towards it
            performHighlightAnimation(1);
            userArrow.style.transform = "rotate(45deg)";
            break;
        case "c":
            //highlight the third answer and have the user arrow point towards it
            performHighlightAnimation(2);
            userArrow.style.transform = "rotate(225deg)";
            break;
        case "d":
            //highlight the fourth answer and have the user arrow point towards it
            performHighlightAnimation(3);
            userArrow.style.transform = "rotate(135deg)";
            break;
        case "#":
            //user has hit the A+B button
            //call makeSelection to confirm the user's choice
            makeSelection();
            break;
        default:
            break;
    }
}

//function to handle the game timer
function handleTime() {
    //decrease the time value amd append it to the HTML page
    time--;
    document.getElementById("timeLeft").innerText = time;

    //if time has run out
    if (time <= 0) {
        //show the results screen
        showResults();
        //show the out of time message
        document.getElementById("outOfTimeMessage").style.display = "unset";
    }
}

//function to highlight the answer card on the HTML page
function performHighlightAnimation(num) {
    //remove the selected class from previous selections
    for (let i = 0; i < theAnswers.length; i++) {
        //if i is not the user's choice
        if (i != num) {
            if (theAnswers[i].classList.contains("selected")) {
                theAnswers[i].classList.remove("selected"); //remove the selected class
            }
        }
    }

    //add the selected class to the user's selected answer HTML card
    theAnswers[num].classList.add("selected");
}

//function to confirm the user's choice
function makeSelection() {
    //userChoice variable
    let userChoice;

    //clear both intervals used in the game
    clearInterval(choiceTimer);
    clearInterval(timeInterval);

    //loop through all the answers to see which has the selected class
    for (let i = 0; i < theAnswers.length; i++) {
        if (theAnswers[i].classList.contains("selected")) {
            userChoice = theAnswers[i]; //set userChoice to the selected answer
        }
    }

    //if the timer has not run out
    if (time > 0) {
        //check if the userChoice is answer #1
        if (userChoice.id == "answer1") {
            //move the userArrow towards the answer
            userArrow.style.transform = "rotate(-45deg) translateY(-100px)";
        }
        //check if the userChoice is answer #2
        else if (userChoice.id == "answer2") {
            //move the userArrow towards the answer
            userArrow.style.transform = "rotate(45deg) translateY(-100px)";
        }
        //check if the userChoice is answer #3
        else if (userChoice.id == "answer3") {
            //move the userArrow towards the answer
            userArrow.style.transform = "rotate(225deg) translateY(-100px)";
        }
        //check if the userChoice is answer #4
        else if (userChoice.id == "answer4") {
            //move the userArrow towards the answer
            userArrow.style.transform = "rotate(135deg) translateY(-100px)"; 
        }

        //call the showResults function after two seconds
        setTimeout(showResults, 2000);

        //if the userChoice answer has the correct class
        if (userChoice.classList.contains("correct")) {

            //remove the correct class
            userChoice.classList.remove("correct");

            //show the correct answer message
            document.getElementById("correctMessage").style.display = "unset";
            //increment totalGuessed, and append it to the HTML page
            totalGuessed++;
            document.getElementById("tunesGuessed").innerText = totalGuessed;

            //if maxTime is more than 15
            if (maxTime > 15) {
                maxTime = maxTime - 2; //decrease the guessing time by 2 seconds
            }

            //reset time to the new maxTime
            time = maxTime;

            //restart the game by calling the gameFunctions function after 6 seconds
            setTimeout(gameFunctions, 6000);
        }
        //otherwise the userChoice answer was incorrect
        else {
            //show the incorrect answer message
            document.getElementById("incorrectMessage").style.display = "unset";
            //call the endGame function
            endGame();
        }
    }
    else {
        //call the endGame function as the user has ran out of time
        endGame();
    }
}

//function to display the results overlay
function showResults() {
    //set the overlay to opacity 1 and display to unset
    document.getElementById("overlay").style.opacity = 1;
    document.getElementById("overlay").style.display = "unset";

    //clear both intervals used in the game
    clearInterval(choiceTimer);
    clearInterval(timeInterval);
}

//function to end the game
function endGame() {
    //reset both time values
    maxTime = 60;
    time = 60;

    //clear the intervals used in the game
    clearInterval(handleTime);
    clearInterval(handleChoice);

    //once 4 seconds have passed
    setTimeout(() => {
        //show the main screen elements
        connectButton.style.display = "block";
        playButton.style.display = "block";
        document.getElementById("gameInstructions").style.display = "block";

        //hide the game screen elements
        document.getElementById("overlay").style.display = "none";
        document.getElementById("overlay").style.opacity = 0;
        document.getElementById("allAnswers").style.display = "none";
        document.getElementById("incorrectMessage").style.display = "none";
        document.getElementById("outOfTimeMessage").style.display = "unset";
        document.getElementById("titleInstructionTwo").style.display = "none";
        document.getElementById("gameInfo").style.display = "none";
        document.getElementById("titleInstructionOne").style.display = "none";
    }, 4000);
}

//event listener for the startButton
connectButton.addEventListener("click", () => {
    //connect to the micro:bit serial port by calling connectMicrobit function
    connectMicrobit();

    //show the play button
    playButton.style.display = "block";
});

//event listener for the play button
playButton.addEventListener("click", () => {
    //if the serial port is connected
    if (connection) {
        //start the totalGuessed value at 0 and reset the HTML tunesGuessed tag counter
        totalGuessed = 0;
        document.getElementById("tunesGuessed").innerText = 0;

        //set time and the timeLeft HTML text to 60
        time = 60;
        document.getElementById("timeLeft").innerText = 60;

        //start the game by calling the gameFunctions function
        gameFunctions();

        //hide the main screen elements
        connectButton.style.display = "none";
        playButton.style.display = "none"; 
        document.getElementById("gameInstructions").style.display = "none";
    }
    else {
        //alert the user that the micro:bit is not connected to the serial port
        alert("Ensure your Micro:bit is connected!")
    }
    
});

