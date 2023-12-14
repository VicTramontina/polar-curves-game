document.addEventListener('DOMContentLoaded', function () {
    let lastScore = localStorage.getItem('lastScore');
    if (lastScore) {
        document.getElementById('score').style.display = 'block';
        document.getElementById('last-score').innerHTML = lastScore;
    }
});

const MQ = MathQuill.getInterface(2);

var score = 0;
var difficulty = 0;
var scaleFactor = 50;
var lastCurve = '';
var animation = false;

const randomCurves = {
    'Rose': 'r = 3 * cos(4 * theta)',
    'Limaçon with loop': 'r = 1 - 2*cos(theta)',
    'Cardioid': 'r = 1 - cos(theta)',
    'Lemniscate': 'r = sqrt(2 * cos(2 * theta))',
    'Circle': 'r = 2',
    'Archimedean spiral': 'r = 0.1 * theta',
    'Fermat spiral': 'r = 0.5 * sqrt(theta)',
    'Logarithmic spiral': 'r = exp(0.06 * theta)',
    'Hyperbolic spiral': 'r = 8 / theta'
};   

function setDifficulty(value) {
    if (value === difficulty) return;
    difficulty = Number(value);
    document.getElementsByName('difficulty').forEach((element, index)=> {
        index === difficulty && !element.classList.contains('selected') ? element.classList.add('selected') : element.classList.remove('selected');
    });
}

function clear() {
    document.getElementById('random-canvas').innerHTML = '';
    document.getElementById('random-curve').innerHTML = '';
    document.getElementById('options-container').innerHTML = '';
}
 

function startGame() {
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    clear();

    generateQuestion().then(() => {
        score++;
        document.getElementById('score').innerHTML = score;
        startGame();    
    }).catch(() => {
        backToMenu();
    });
}

function backToMenu() {
    document.getElementById('start-menu').style.display = 'block';
    document.getElementById('game').style.display = 'none';
    document.getElementById('score').style.display = 'block';
    
    localStorage.setItem('lastScore', score);
    document.getElementById('last-score').innerHTML = score;

    document.getElementById('start-button').innerHTML = 'Play again';

    score = 0;
}

function toggleAnimation() {
    animation = !animation;
    document.getElementById('animate-button').innerHTML = animation ? 'Disable animation' : 'Enable animation';
}

function generateQuestion() {
    return new Promise((resolve, reject) => {
        
        // Generate a random curve
        let keys = Object.keys(randomCurves);
        keys = keys.filter(key => key !== lastCurve); // Avoid repeating the same curve
        let randomCurveName = keys[Math.floor(Math.random() * keys.length)];
        let randomCurve = randomCurves[randomCurveName];
        lastCurve = randomCurveName; // Save the curve to avoid repetition
        
        if (difficulty === 0) {
            let mathFieldSpan = document.getElementById('random-curve');
            mathFieldSpan.style.display = 'block';
            mathFieldSpan.innerHTML = '';
            let mathField = MQ.StaticMath(mathFieldSpan);
            mathField.latex(randomCurve);
        } else {
            document.getElementById('random-curve').style.display = 'none';
        }

        let sketch = function (p) {
            p.setup = function () {
                let canvas = p.createCanvas(500, 500); 
                canvas.parent('random-canvas');
                p.noLoop(); 
            }

            p.draw = function () {
                p.background(232, 227, 203); // Background 
                
                p.translate(p.width / 2, p.height / 2);  // Move to the center of the canvas
                
                drawCartesianGrid(p, scaleFactor); // Draw the Cartesian grid

                // Start border
                p.stroke(0);
                p.strokeWeight(5);
                p.noFill();
                p.rect(-p.width/2, -p.height/2, p.width, p.height);
                // End border

                p.stroke(0);
                p.strokeWeight(3);

                let range = p.TWO_PI;
                // More points for spiral curves to draw better
                if (randomCurveName.includes('spiral')) {
                    range *= 4;
                }
                
                animation ? drawPointsAnimated(p, range) : drawPoints(p, range);
            }
        }
        
        function drawPoints(p, range) {
            p.beginShape();
            for (let theta = 0; theta < range; theta += 0.001) { // 2pi = 360 degrees
                let r;
                try {
                    r = evaluatePolarEquation(theta, p); 
                } catch (error) {
                    console.error("Invalid equation:", error);
                    reject(error);
                    return;
                }
                
                // Convert from polar coordinates to Cartesian coordinates
                let x = r * p.cos(theta); 
                let y = r * p.sin(theta); 

                p.vertex(x, y);
            }
            p.endShape();
        }

        async function drawPointsAnimated(p, range) {
            async function drawPoints() {
                for (let theta = 0; theta < range; theta += 0.01) { // 2pi = 360 degrees
                    let r;
                    try {
                        r = evaluatePolarEquation(theta, p); 
                    } catch (error) {
                        console.error("Invalid equation:", error);
                        reject(error);
                        return;
                    }
                    
                    // Convert from polar coordinates to Cartesian coordinates
                    let x = r * p.cos(theta); 
                    let y = r * p.sin(theta); 
    
                    // Wait for the timeout to finish before proceeding to the next iteration
                    await new Promise(resolve => setTimeout(() => {
                        p.point(x, y);
                        resolve();
                    }, 0));
                }
            }
            drawPoints();
        }

        function drawCartesianGrid(p, scale) {
            p.stroke(180); // Gray color 
            p.strokeWeight(1);

            // Horizontal lines
            for (let y = -p.height; y < p.height; y += scale) {
                p.line(-p.width, y, p.width, y);
            }
        
            // Vertical lines
            for (let x = -p.width; x < p.width; x += scale) {
                p.line(x, -p.height, x, p.height);
            }
        
            // Drawing axes
            p.stroke(0); // Black color for the axes
            p.strokeWeight(1);
            p.line(-p.width, 0, p.width, 0); // X-axis
            p.line(0, -p.height, 0, p.height); // Y-axis
        }

        function evaluatePolarEquation(theta, p) {
            let scope = { theta: theta };   
            let r = math.evaluate(randomCurve, scope);
            return r * scaleFactor; // Scale the size of the curve
        }
        
        function chooseOption(option) {
            return function() {
                if (randomCurves[option] === randomCurve) {
                    resolve();
                } else {
                    reject();
                }
            }
        }
        
        function createOptions() {
            let optionsContainer = document.getElementById('options-container');
            const keys = Object.keys(randomCurves);
            const equations = Object.values(randomCurves);

            // Difficulty 0 = options with names only
            // Difficulty 1 = options with names and equations
            // Difficulty 2 = options with equations only
            function createButton(text, key, type) {
                let button = document.createElement('button');
                if (type === 'equation'){
                    let span = document.createElement('span');
                    button.appendChild(span);
                    MathQuill.StaticMath(span).latex(text);
                } else {
                    button.innerHTML = text;
                }
                button.onclick = chooseOption(key);
                button.classList.add('button');
                optionsContainer.appendChild(button);
            }

            switch (difficulty) {
                case 0:
                    keys.forEach(key => createButton(key, key, 'text'));
                    break;
                case 1:
                    keys.forEach((key, i) => Math.random() > 0.5 ? createButton(key, key, 'text') : createButton(equations[i], key, 'equation'));
                    break;
                case 2:
                    equations.forEach((equation, i) => createButton(equation, keys[i], 'equation'));
                    break;
                default:
                    break;
            }
        }

        new p5(sketch);
        createOptions();
    });
}
