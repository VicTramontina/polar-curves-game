document.addEventListener('DOMContentLoaded', function () {
    const randomCurves = {
        'Rosácea': 'r = 3 * cos(4 * theta)',
        'Limaçon com laço': 'r = 1 - 2*cos(theta)',
        'Cardioide': 'r = 1 - cos(theta)',
        'Lemniscata': 'r = sqrt(2 * cos(2 * theta))',
        'Círculo': 'r = 2',
        'Espiral arquimediana': 'r = 0.1 * theta',
        'Espiral de Fermat': 'r = 0.5 * sqrt(theta)',
        'Espiral logarítmica': 'r = exp(0.06 * theta)',
        'Espiral hiperbólica': 'r = 8 / theta'
    };    

    // generate random curve
    let keys = Object.keys(randomCurves);
    let randomCurveName = keys[Math.floor(Math.random() * keys.length)];
    let randomCurve = randomCurves[randomCurveName];
    document.getElementById('random-curve').innerHTML = randomCurve;

    let sketch = function (p) {
        p.setup = function () {
            let canvas = p.createCanvas(500, 500); 
            canvas.parent('random-canvas'); // Ensure you have a div with this id in your HTML
            p.noLoop(); 
        }
    
        p.draw = function () {
            p.background(255);
            p.translate(p.width / 2, p.height / 2);  // move pro centro do canvas

            p.strokeWeight(3);
    
            p.beginShape(); 

            let range = p.TWO_PI;
            //mais pontos para espirais desenhar melhor
            if (randomCurveName.includes('spiral')) {
                range *= 4;
            }

            for (let theta = 0; theta < range; theta += 0.001) { // 2pi = 360 graus
                let r;
                try {
                    r = evaluatePolarEquation(theta, p); // Passing p as an argument
                } catch (error) {
                    console.error("Invalid equation:", error);
                    break;
                }
                
                // converter de coordenadas polares para cartesianas
                let x = r * p.cos(theta); 
                let y = r * p.sin(theta); 
                // desenhar o ponto
                p.vertex(x, y); 
            }
            p.endShape(); 
        }
    }
    

    function evaluatePolarEquation(theta, p) {
        let scope = { theta: theta };
        let scalingFactor = 50;
        let r = math.evaluate(randomCurve, scope);
        return r * scalingFactor; // Scale the radius
    }

    function chooseOption(option) {
        return function() {
            if(randomCurves[option] === randomCurve) {
                alert("Você acertou!");
            } else {
                alert("Você errou!");   
            }
        }
    }

    function createOptions() {
        let opcoesContainer = document.getElementById('opcoes-container');
        for (let key in randomCurves) {
            let button = document.createElement('button');
            button.innerHTML = key;
            button.onclick = chooseOption(key);
            opcoesContainer.appendChild(button);
        }
    }

    new p5(sketch);
    createOptions();
});
