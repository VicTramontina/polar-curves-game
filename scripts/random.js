document.addEventListener('DOMContentLoaded', function () {
    const randomCurves = {
        'rose': 'r = 125 * cos(15 * theta)',
        // 'cardioid': 'r = 1 + cos(theta)',
        // 'lemniscate': 'r = 2 * cos(2 * theta)',
        // 'circle': 'r = 50 * cos(theta)',
        // 'spiral': 'r = theta',
        // 'archimedean spiral': 'r = theta ^ 2',
        // 'fermat spiral': 'r = sqrt(theta)',
        // 'logarithmic spiral': 'r = exp(theta)',
        // 'hyperbolic spiral': 'r = 1 / theta',
        // 'conic spiral': 'r = 1 / (theta ^ 2)',
        // 'lituus': 'r = 1 / sqrt(theta)',
    }

    // generate random curve
    let keys = Object.keys(randomCurves);
    let randomCurveName = keys[Math.floor(Math.random() * keys.length)];
    let randomCurve = randomCurves[randomCurveName];
    document.getElementById('random-curve').innerHTML = randomCurveName;

    let sketch = function (p) {
        p.setup = function () {
            let canvas = p.createCanvas(400, 400); 
            canvas.parent('random-canvas'); // Ensure you have a div with this id in your HTML
            p.noLoop(); 
        }
    
        p.draw = function () {
            p.background(255); 
            p.translate(p.width / 2, p.height / 2);  // move pro centro do canvas
    
            p.beginShape(); 
            for (let theta = 0; theta < p.TWO_PI; theta += 0.01) { // 2pi = 360 graus
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
            p.endShape(p.CLOSE); 
        }
    }
    

    function evaluatePolarEquation(theta, p) {
        let scope = { theta: theta };
        return math.evaluate(randomCurve, scope);
    }

    new p5(sketch);
});
