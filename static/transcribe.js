// Check for Speech Recognition support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            <h1>⚠️ Browser Not Supported</h1>
            <p>Speech Recognition is not supported in this browser.</p>
            <p>Please use Chrome, Edge, or Safari.</p>
        </div>
    `;
    throw new Error('Speech Recognition not supported');
}

// Initialize Speech Recognition
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

console.log('Speech Recognition initialized:', recognition);

// State
let isListening = false;
let finalTranscript = '';

// DOM Elements
const toggleButton = document.getElementById('toggleButton');
const transcriptionDisplay = document.getElementById('transcriptionDisplay');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const buttonText = document.querySelector('.button-text');
const buttonIcon = document.querySelector('.button-icon');

// Toggle listening
toggleButton.addEventListener('click', () => {
    console.log('Button clicked. Current state:', isListening);
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

function startListening() {
    console.log('Starting recognition...');
    try {
        recognition.start();
        isListening = true;
        updateUI('listening');
        console.log('Recognition started successfully');
        
        // Clear placeholder on first start
        if (transcriptionDisplay.querySelector('.placeholder')) {
            transcriptionDisplay.innerHTML = '';
        }
    } catch (error) {
        console.error('Error starting recognition:', error);
        // alert('Could not start microphone. Error: ' + error.message);
    }
}

function stopListening() {
    console.log('Stopping recognition...');
    recognition.stop();
    isListening = false;
    updateUI('ready');
}

// Update UI based on state
function updateUI(state) {
    console.log('Updating UI to state:', state);
    if (state === 'listening') {
        statusText.textContent = 'Listening...';
        buttonText.textContent = 'Stop Listening';
        buttonIcon.textContent = '⏹️';
        toggleButton.classList.add('listening');
    } else if (state === 'ready') {
        statusText.textContent = 'Ready';
        buttonText.textContent = 'Start Listening';
        buttonIcon.textContent = '🎤';
        toggleButton.classList.remove('listening');
    }
}

// Handle recognition start
recognition.onstart = () => {
    console.log('Recognition has started');
};

// Handle recognition results
recognition.onresult = (event) => {
    console.log('Recognition result received:', event);
    let interim = '';
    
    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log(`Result ${i}: "${transcript}", isFinal: ${event.results[i].isFinal}`);
        
        if (event.results[i].isFinal) {
            fetch('/log-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sentence: transcript })
            });
            finalTranscript += transcript + ' ';
        } else {
            // console.log('Interim transcript:', interim +' ' +transcript);
            fetch('/log-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sentence: interim + transcript })
            });
            interim += transcript;
        }
    }
    
    // Update display
    updateTranscriptionDisplay(finalTranscript, interim);
};

// Update transcription display with final and interim results
function updateTranscriptionDisplay(final, interim) {
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';
    
    if (final) {
        const finalDiv = document.createElement('div');
        finalDiv.className = 'final-transcript';
        finalDiv.textContent = final;
        textContainer.appendChild(finalDiv);
    }
    
    if (interim) {
        const interimDiv = document.createElement('div');
        interimDiv.className = 'interim-transcript';
        interimDiv.textContent = interim;
        textContainer.appendChild(interimDiv);
    }
    
    transcriptionDisplay.innerHTML = '';
    transcriptionDisplay.appendChild(textContainer);
    
    // Auto-scroll to bottom
    transcriptionDisplay.scrollTop = transcriptionDisplay.scrollHeight;
}

// Handle recognition errors
recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error, event);
    
    if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        alert('Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.');
        stopListening();
    } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
    } else if (event.error === 'network') {
        alert('Network error occurred. Please check your internet connection.');
        stopListening();
    } else {
        alert(`Recognition error: ${event.error}`);
        if (isListening) {
            stopListening();
        }
    }
};

// Handle recognition end
recognition.onend = () => {
    console.log('Recognition ended. isListening:', isListening);
    if (isListening) {
        // Restart recognition if it ended unexpectedly
        console.log('Attempting to restart recognition...');
        try {
            recognition.start();
        } catch (error) {
            console.error('Error restarting recognition:', error);
            stopListening();
        }
    }
};

// Initialize UI
updateUI('ready');
console.log('Transcription app initialized');
