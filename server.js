//server.js - handles the logic, data processing and communication with external APIs

//import packages
const axios = require('axios'); //allows communication with third party, only sends and receives data from api
const express = require('express'); //Server - express actually handles the requests and responses, manipulating received data from axios
const cors = require('cors'); //CORS - Cross Origin Resource Sharing, allows the server to accept requests from the front end, which is on a different port
const validator = require('validator'); //validator is a javascript tool that helps with validating data
const app = express(); //create an express application, which handles everything
const PORT = 3000; //choose any port number
require('dotenv').config(); //uses crucial info from .env securely
//config is a dotenv method to load .env info
const API_KEY = process.env.HUGGING_FACE_API_KEY; //dotenv config loads env variables from .env but you still need to access the key

app.use(express.json()); //app.use is an express function that acts as a middleware, aka tunnel to shape the data that express unboxes
//the json part basically converts the recieved json to a readable format, like a javascript object so the express can change it
app.use(express.static('public'));//this tells express that it can affect the static (received in exactly the same state as it is) files under the specification of what u want, in my case it can use the public files in my directory
//we put front-end files under public and give express permission to use it because express is our server framework, so when a user gets on the application the browser sends a request to the express server and processes the files it has access to so it displays correctly to the user, providing control over which files to show
app.use(cors()); //use cors

//choose what to filter out from the AI response
const blockedWords = "Be friendly. Respond strictly and only to the following message without adding extra content or repeating the prompt: ";

function filterResponse(aiResponse, userInput) { //takes both of these to filter out
    const regexBlockedWords = new RegExp(blockedWords, 'g'); //regex instance must be created to use, taking two parameters, pattern which is what you are searching for and flags which modify the searching
    //a regex object is created as a search tool to be used later
    //RegExp is the formal name used in code and regex is informal, both meaning regular expression aka a tool for string pattern and searching 
    aiResponse = aiResponse.replace(regexBlockedWords, '').trim(); //replace method in js takes in params of pattern and replacement, so i am taking the regexblocked words and then replacing with spaces aka removing it, and then trimming to clean it
    //same process below but with userinput
    const regexUserInput = new RegExp(userInput, 'g');
    aiResponse = aiResponse.replace(regexUserInput, '').trim();

    aiResponse = aiResponse.replace(/""\./g, '').replace(/"$/, '').replace(/^"$/, '').trim();
//first regex removes the ""\., second removes the " at the end of the string, third removes the " both at the start and end of the string only if it exists, and then trims it to clean it
//second regex removes all the quotes at the end and if there is one remaining at the start and end of the string the last regex handles it since it removes quotes at the start and end of a string
    return aiResponse.trim();
}


//async is asynchronous, aka this will take a while so allow it to wait for a response
async function getAIResponse(userInput){ 
    const apiUrl = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct';
    const headers = {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`, 
    };

    const data = { //what gets sent to the ai
        inputs: `Be friendly. Respond strictly and only to the following message without adding extra content or repeating the prompt: "${userInput}".`,
        parameters: {
            temperature: 0.3, // Lower temperature for more focused responses
            max_tokens: 50,   // Limit response length for short messages
            stop: ["\n"], //when the ai response should stop, here its at a new line
        },
    };

    //Payload means actual info sent rather than metadata or headers, the data is the proper info sent to the AI
    console.log('Request Payload:', data); // Display the data that will be sent directly to the AI
    
    try {
        const response = await axios.post(apiUrl, data, {headers}); //Axios POST method which sends request to API, parameters: URL, Data and config (optional)

        //Show the user's message and AI's response
        console.log('User input:', userInput);
        console.log('AI Response:', response.data);

        //check if data section exists in the AI's json and holds the response of the ai in an array of object, then check if the first response/object exists, then check if there is something inside the first object under the generated text property
        if (response.data && response.data[0] && response.data[0].generated_text) {
            return response.data[0].generated_text;  // Extract the text from the object
        } else {
            return "Sorry, no relevant response generated.";  //If a proper reply doesnt exist add warning
        }

    } catch (error){ //for any error or issue that might occur 
        console.error('Error fetching AI response:', error); //display for debugging
        return { reply: "Sorry, there was an error processing your request." };  //send user a friendly error message
    }
}

    //chat is a POST endpoint - url path that users can send a POST request to
app.post('/chat', async (req, res) => { //express post function takes path and callback (handles request taking two arguments, request and response), arrow removes need for function(req,res), shortens it basically
    try {
        let userInput = req.body.message; //json section 

        userInput = validator.escape(userInput); //use validator to sanitize the user input, escape function automatically replaces dodgy html characters with safe ones
        userInput = validator.trim(userInput); //remove any extra spaces from the user input so the ai doesnt get confused and its cleaner

        let aiResponse = await getAIResponse(userInput);
        aiResponse = filterResponse(aiResponse, userInput);  
        res.json({ reply: aiResponse });  //adds new json section to handle response sent to the client - this part is used in script to display the AI response
    } catch (error) {
        console.error('Error handling the request:', error); //error for developers
        res.status(500).send('Internal Server Error'); //error for clients, 500 being default for server issues
    }
});

app.listen(PORT, () => { //anonymous function in js, can be unnamed to define behaviour right where you need it
    console.log(`Server is running on http://localhost:${PORT}`); //refers to port chosen from earlier, ports being doors to different rooms in the office which have different tasks to do, 3000 is default for development
});

