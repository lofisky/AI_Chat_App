//script.js - handles user input and interactions with browser


function escapeHtml(str) { //this function takes a string and replaces dodgy html characters with safe ones
    return str.replace(/[&<>'"]/g, function (match) { //regex with [] which means it checks for individual characters specified in them, and the g means global aka it checks the entire string instead of stopping at the first match
        const escapeMap = { //map of dodgy characters and their safe replacements
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;', //these are default replacements to prevent dodgy html characters from being used and affecting the page
        };
        return escapeMap[match]; //returns the safe replacement for the dodgy character
    });
}

let isLoading = false; //variable to check if the AI is currently processing a request - initially inactive meaning no request is active

async function sendMessage() {
    if (isLoading) return; //if the AI is currently processing a request, return early to prevent a new request from being sent to stop spam
    
    isLoading = true; //if the previous check is passed, aka there were no current processes happening, then allow the processing of the request and continue

    const userInput = document.getElementById("userInput").value; //get the user input from the input box

    if (userInput.trim() !== "") { //if the user input is not empty aka has content
        const sanitizedUserInput = escapeHtml(userInput); //sanitize the user input with the escapeHtml function created above to prevent malicious html characters from being used before sending it to the AI

        const userMessageDiv = document.createElement('div'); //create a div element to hold the user's message
        userMessageDiv.textContent = `You: ${sanitizedUserInput}`; //put the user's message in the div
        userMessageDiv.classList.add('userMessage'); //add a class to the div to style it
        document.querySelector('.messages').appendChild(userMessageDiv); //add the div that contains the message to the chatbox
        scrollToBottom(); //after adding a message, scroll down automatically to show the latest message
        document.getElementById('userInput').value = ""; //empty the user input box for the next message

        // Create a loading message for AI
        const loadingMessageDiv = document.createElement('div'); //create a div element to hold the loading message
        loadingMessageDiv.textContent = "AI: Typing..."; //put the loading message in the div
        loadingMessageDiv.classList.add('aiMessage', 'loadingMessage'); //classList allows multiple variables but they all have their own invidiual classes, its a faster way than having to write multiple classList method statements
        document.querySelector('.messages').appendChild(loadingMessageDiv); //add the loading message to the chatbox
        scrollToBottom(); //scroll down for latest message

        try {
            const response = await axios.post('http://localhost:3000/chat', { message: userInput }); //check for interactions with the port and chat endpoint (port being like a building address where my service is being hosted and endpoint being a specific room in that location that defines what action will be taken at the address, this is a url path where the app listens for requests) and put the userInput under the message section of json which is sent to the ai

        
            document.querySelector('.messages').removeChild(loadingMessageDiv); //remove the loading message after the AI has responded

            const aiMessageDiv = document.createElement('div'); //create a div for the AI's message
            aiMessageDiv.textContent = `AI: ${response.data.reply}`; //put the AI's response in the div, using json syntax to get to the response
            aiMessageDiv.classList.add('aiMessage'); //add a class to the ai div to style it

            loadingMessageDiv.setAttribute('aria-live', 'polite'); //aria-live allows accessibility with screen reading features and polite means it allows the users to finish what they were doing before it announces something

            document.querySelector('.messages').appendChild(aiMessageDiv); //add ai message to chatbox
            scrollToBottom(); //scroll after adding new ai message for latest response

        } 
        catch (error) {
            console.error('Error sending message to the server:', error); //if there is an error, display it for debugging, showing the reason too

            const errorMessageDiv = document.createElement('div'); //create div for error message that will be displayed to the user
            errorMessageDiv.textContent = "AI: Sorry, something went wrong. Please try again."; //put the error message in the div
            errorMessageDiv.classList.add('aiMessage'); //add a class to the error message div to style it
            document.querySelector('.messages').appendChild(errorMessageDiv); //add the error message to the chatbox
            scrollToBottom(); //scroll down for latest message even if its an error
        }
        finally{ //finally is used with a try-catch block and specifies a block of code that will always run whether there was an error or not
            isLoading = false; //after the request is done, set the isLoading variable to false to allow new requests to be sent
        }
    }
}

document.getElementById('userInput').addEventListener('keydown', (event) => { //event listener for when the user presses a key, it uses an anonymous function which is a function defined without a name, it is defined right there to be used immediately
    if (event.key === 'Enter') { //if the key pressed is the enter key
        sendMessage(); //send message 
    }
});


function scrollToBottom(){ //function to scroll to the bottom of the chatbox to show the latest messages
    const messages = document.querySelector('.messages'); //select the chatbox
    messages.scrollTop = messages.scrollHeight; //scrollTop specifies the amount of pixels you scroll down from the top to the bottom, and the scrollHeight specifies the total height of the content inside the element, so by setting the scrollTop to the height of all the contents in the element it scrolls down the full length to the bottom of the messages
}