// Load all alphabet animations
const alphabetFiles = [
    'A.js', 'B.js', 'C.js', 'D.js', 'E.js', 'F.js', 'G.js', 'H.js', 'I.js', 'J.js',
    'K.js', 'L.js', 'M.js', 'N.js', 'O.js', 'P.js', 'Q.js', 'R.js', 'S.js', 'T.js',
    'U.js', 'V.js', 'W.js', 'X.js', 'Y.js', 'Z.js'
];

// Load each alphabet file
alphabetFiles.forEach(file => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `./Alphabets/${file}`;
    document.head.appendChild(script);
});

// Wait for all scripts to load and then create the alphabets object
window.addEventListener('load', () => {
    setTimeout(() => {
        window.alphabets = {
            A: window.A, B: window.B, C: window.C, D: window.D, E: window.E, F: window.F,
            G: window.G, H: window.H, I: window.I, J: window.J, K: window.K, L: window.L,
            M: window.M, N: window.N, O: window.O, P: window.P, Q: window.Q, R: window.R,
            S: window.S, T: window.T, U: window.U, V: window.V, W: window.W, X: window.X,
            Y: window.Y, Z: window.Z
        };
    }, 100);
});