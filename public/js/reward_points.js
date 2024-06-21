function tcon1() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['rgba(255, 255, 255, 1)']
    });
}



let countdown = 48 * 60 * 60;
const timerElement = document.getElementById('timer');





function updateTimer() {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;

    timerElement.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (countdown > 0) {
        countdown--;
        setTimeout(updateTimer, 1000);
    }
}

updateTimer();

function goHome() {
    window.location.href = '/';
}



function triggerConfetti() {
    const duration = 2 * 1000; 
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: {  x: 0, y: 1 }
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 1 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}