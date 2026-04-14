const fs = require('fs');
let code = fs.readFileSync('js/multiplayerUI.js', 'utf-8');

code = code.replace(/logicexport/g, 'logic\nexport');

code += \n
export function showInGameEmoji(participantId, emojiContent) {
    const popup = document.getElementById(\emoji-popup-\\);
    if (!popup) return;
    
    // reset wrapper opacity
    popup.style.opacity = '1';
    
    const span = document.createElement('span');
    span.innerText = emojiContent;
    span.className = 'absolute -bottom-4 left-1/2 -translate-x-1/2 transition-all duration-[2000ms] ease-out drop-shadow-md text-3xl font-emoji z-[100] scale-50 block pointer-events-none';
    popup.appendChild(span);
    
    requestAnimationFrame(() => {
        popup.getBoundingClientRect(); // force reflow
        const driftX = Math.round((Math.random() - 0.5) * 80);
        span.style.transform = \	ranslate(calc(-50% + \px), -120px) scale(2.5)\;
        span.style.opacity = '0';
    });
    
    setTimeout(() => {
        span.remove();
        if (popup.children.length === 0) {
            popup.style.opacity = '0';
        }
    }, 2000);
}
;

fs.writeFileSync('js/multiplayerUI.js', code);
console.log('Appended function and fixed logicexport');
