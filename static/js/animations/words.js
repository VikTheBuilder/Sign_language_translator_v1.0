// Load all word animations
const wordFiles = ['TIME.js', 'HOME.js', 'PERSON.js', 'YOU.js'];

// Load each word file
wordFiles.forEach(file => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `./Words/${file}`;
    document.head.appendChild(script);
});

// Word list
const wordList = ['TIME', 'HOME', 'PERSON', 'YOU'];

// Wait for all scripts to load and then create the words object
window.addEventListener('load', () => {
    setTimeout(() => {
        window.words = {
            TIME: window.TIME,
            HOME: window.HOME,
            PERSON: window.PERSON,
            YOU: window.YOU,
            wordList: wordList
        };
    }, 100);
});