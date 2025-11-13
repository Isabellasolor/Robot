const URL = "./my-pose-model/";
let model, webcam, ctx, maxPredictions;

const startBtn = document.getElementById('startBtn');
const statusDiv = document.getElementById('status');
const detectedClassDiv = document.getElementById('detectedClass');
const widgetCamera = document.getElementById('widgetCamera');
const leftArm = document.getElementById('leftArm');
const rightArm = document.getElementById('rightArm');

startBtn.addEventListener('click', init);

async function init() {
    startBtn.disabled = true;
    statusDiv.textContent = 'Cargando modelo...';
    
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        
        const size = 200;
        const flip = true;
        webcam = new tmPose.Webcam(size, size, flip);
        await webcam.setup();
        await webcam.play();
        
        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");
        
        widgetCamera.style.display = 'block';
        statusDiv.textContent = 'Detectando posturas...';
        window.requestAnimationFrame(loop);
        
    } catch (error) {
        statusDiv.textContent = 'Error al cargar el modelo';
        console.error(error);
        startBtn.disabled = false;
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    
    let maxProb = 0;
    let maxClass = '';
    
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > maxProb) {
            maxProb = prediction[i].probability;
            maxClass = prediction[i].className;
        }
    }
    
    if (maxProb > 0.6) {
        detectedClassDiv.textContent = maxClass;
        updateRobot(maxClass);
    }
    
    drawPose(pose);
}

function updateRobot(className) {
    leftArm.classList.remove('up', 'error');
    rightArm.classList.remove('up', 'error');
    
    const lowerClass = className.toLowerCase();
    
    if (lowerClass.includes('izquierda') || lowerClass.includes('left')) {
        leftArm.classList.add('up');
    } else if (lowerClass.includes('derecha') || lowerClass.includes('right')) {
        rightArm.classList.add('up');
    } else if (lowerClass.includes('dos') || lowerClass.includes('ambas') || lowerClass.includes('both') || lowerClass.includes('arriba')) {
        leftArm.classList.add('up');
        rightArm.classList.add('up');
    } else if (lowerClass.includes('error')) {
        leftArm.classList.add('error');
        rightArm.classList.add('error');
    }
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
