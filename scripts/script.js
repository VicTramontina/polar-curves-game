document.addEventListener('DOMContentLoaded', function () {
    let ultimaPontuacao = localStorage.getItem('ultimaPontuacao');
    if(ultimaPontuacao) {
        document.getElementById('pontuacao').style.display = 'block';
        document.getElementById('ultima-pontuacao').innerHTML = ultimaPontuacao;
    }
});

const MQ = MathQuill.getInterface(2);

var score = 0;
var dificuldade = 0;
var fatorDeEscala = 50;
var ultimaCurva = '';
var animacao = false;

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

function setDificuldade(value) {
    if(value === dificuldade) return;
    dificuldade = Number(value);
    document.getElementsByName('dificuldade').forEach((element, index)=> {
        index === dificuldade && !element.classList.contains('selected') ? element.classList.add('selected') : element.classList.remove('selected');
    });
}

function clear() {
    document.getElementById('random-canvas').innerHTML = '';
    document.getElementById('random-curve').innerHTML = '';
    document.getElementById('opcoes-container').innerHTML = '';
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
        voltarMenu();
    });
}


function voltarMenu() {
    document.getElementById('ultima-pontuacao').innerHTML = score;
    localStorage.setItem('ultimaPontuacao', score);
    document.getElementById('pontuacao').style.display = 'block';
    document.getElementById('botao-start').innerHTML = 'Jogar novamente';
    document.getElementById('game').style.display = 'none';
    document.getElementById('start-menu').style.display = 'block';

    score = 0;
}

function ativarDesativarAnimacao() {
    animacao = !animacao;
    document.getElementById('botao-animar').innerHTML = animacao ? 'Desativar animação' : 'Ativar animação';
}



function generateQuestion() {
    return new Promise((resolve, reject) => {
        
        // gerar uma curva aleatória
        let keys = Object.keys(randomCurves);
        keys = keys.filter(key => key !== ultimaCurva); // não repetir a curva
        let randomCurveName = keys[Math.floor(Math.random() * keys.length)];
        let randomCurve = randomCurves[randomCurveName];
        ultimaCurva = randomCurveName; // salvar a curva para não repetir
        
        if(dificuldade === 0) {
            let mathFieldSpan = document.getElementById('random-curve');
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
                p.background(232, 227, 203); // background 
                
                p.translate(p.width / 2, p.height / 2);  // move pro centro do canvas
                
                drawCartesianGrid(p, fatorDeEscala); // desenha a grade cartesiana

                //inicio borda
                p.stroke(0);
                p.strokeWeight(5);
                p.noFill();
                p.rect(-p.width/2, -p.height/2, p.width, p.height);
                //fim borda

                p.stroke(0);
                p.strokeWeight(3);

                let range = p.TWO_PI;
                //mais pontos para espirais desenhar melhor
                if (randomCurveName.includes('spiral')) {
                    range *= 4;
                }
                if (animacao) {
                    drawPointsAnimated(p, range);
                } else {
                    drawPoints(p, range);
                }
            }
        }
        
        
        function drawPoints(p, range) {
            p.beginShape();
            for (let theta = 0; theta < range; theta += 0.001) { // 2pi = 360 graus
                let r;
                try {
                    r = evaluatePolarEquation(theta, p); 
                } catch (error) {
                    console.error("Equação inválida:", error);
                    reject(error);
                    return;
                }
                
                // converter de coordenadas polares para cartesianas
                let x = r * p.cos(theta); 
                let y = r * p.sin(theta); 

                p.vertex(x, y);
            }
            p.endShape();
        }

        async function drawPointsAnimated(p, range) {
            async function drawPoints() {
                for (let theta = 0; theta < range; theta += 0.01) { // 2pi = 360 graus
                    let r;
                    try {
                        r = evaluatePolarEquation(theta, p); 
                    } catch (error) {
                        console.error("Equação inválida:", error);
                        reject(error);
                        return;
                    }
                    
                    // converter de coordenadas polares para cartesianas
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

        function drawCartesianGrid(p, escala) {
            p.stroke(180); //cinza 
            p.strokeWeight(1);

            // linhas horizontais
            for (let y = -p.height; y < p.height; y += escala) {
                p.line(-p.width, y, p.width, y);
            }
        
            // linhas verticais
            for (let x = -p.width; x < p.width; x += escala) {
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
            return r * fatorDeEscala; // scala o tamanho da curva
        }
        
        function chooseOption(option) {
            return function() {
                if(randomCurves[option] === randomCurve) {
                    resolve();
                } else {
                    reject();
                }
            }
        }
        
        function createOptions() {
            let opcoesContainer = document.getElementById('opcoes-container');
            const keys = Object.keys(randomCurves);
            const equations = Object.values(randomCurves);

            //dificuldade 0 = opcoes só com nomes
            //dificuldade 1 = opcoes com nomes e equacoes
            //dificuldade 2 = opcoes só com equacoes
            function createButton(text, key, type) {
                let button = document.createElement('button');
                if(type === 'equation'){
                    let span = document.createElement('span');
                    button.appendChild(span);
                    MathQuill.StaticMath(span).latex(text);
                } else {
                    button.innerHTML = text;
                }
                button.onclick = chooseOption(key);
                button.classList.add('botao');
                opcoesContainer.appendChild(button);
            }

            switch (dificuldade) {
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









