/*********************************************
 * Triple-Swipe (Responsive)
 * inkl. Push, Überlappung, Z-Order
 *********************************************/

// Referenzen
const container = document.getElementById('swipe-container');
const layer1 = document.getElementById('layer1');
const layer2 = document.getElementById('layer2');
const layer3 = document.getElementById('layer3');
const handle1 = document.getElementById('handle1');
const handle2 = document.getElementById('handle2');

// Griff-Breite = 40px => Balkenmitte = x + 20
const HANDLE_WIDTH = 40;
const HANDLE_RADIUS = HANDLE_WIDTH / 2;

/* "Virtuelle" X-Positionen (linke Kante) 
   der Griffe in Container-Koordinaten,
   z.B. handle1X= 100 => Box left=100px 
*/
let handle1X = 0;
let handle2X = 0;

/* Mindestabstand (in px) 
   für den "Push" in der Mitte */
const MIN_GAP = 50;

/* Ziehen-Flags */
let isDraggingHandle1 = false;
let isDraggingHandle2 = false;

/*********************************************
 * Hilfsfunktionen
 *********************************************/

/** 
 * Liefert boundary = handleX + 20 (Balkenmitte) 
 */
function boundary1() {
  return handle1X + HANDLE_RADIUS;
}
function boundary2() {
  return handle2X + HANDLE_RADIUS;
}

/** 
 * Ist handle1 < handle2? (geordnete Lage)
 */
function isOrdered() {
  return handle1X <= handle2X;
}

/** 
 * Begrenze einen Wert [min, max] 
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/** 
 * Wendet Clips und Griff-Positionen an,
 * basierend auf handle1X / handle2X.
 */
function applyPositions() {
  // Container-Größe ermitteln
  const rect = container.getBoundingClientRect();
  const cWidth = rect.width;
  const cHeight = rect.height;

  // Balkenmitten
  const b1 = boundary1();
  const b2 = boundary2();

  // 1. Ausschnitte festlegen
  layer1.style.clip = `rect(0px, ${b1}px, ${cHeight}px, 0px)`;
  layer2.style.clip = `rect(0px, ${b2}px, ${cHeight}px, ${b1}px)`;
  layer3.style.clip = `rect(0px, ${cWidth}px, ${cHeight}px, ${b2}px)`;

  // 2. Griffe positionieren
  //    -> Boxen: link= handleX
  handle1.style.left = handle1X + "px";
  handle2.style.left = handle2X + "px";

  // 3. Z-Index aktualisieren
  updateZOrder();
}

/** 
 * Dynamische Z-Reihenfolge:
 *  - Wenn handle2X < handle1X => handle2 oben
 *  - sonst handle1 oben
 */
function updateZOrder() {
  if (handle2X <= 0) {
    handle2.style.zIndex = 5;
    handle1.style.zIndex = 4;
  } else {
    handle1.style.zIndex = 5;
    handle2.style.zIndex = 4;
  }
}

/*********************************************
 * (A) moveHandle1
 *********************************************/
function moveHandle1(newX) {
  const rect = container.getBoundingClientRect();
  const cWidth = rect.width;

  // clamp: [ -20 .. (cWidth - 20) ]
  const minX = -HANDLE_RADIUS;
  const maxX = cWidth - HANDLE_RADIUS;
  newX = clamp(newX, minX, maxX);

  // Falls geordnet und wir nicht "zwanghaft" 
  // an den Rand wollen => Push 
  if (isOrdered()) {
    // boundary1()+MIN_GAP <= boundary2()
    // => (newX+20)+MIN_GAP <= (handle2X+20)
    if ( (newX + MIN_GAP) > handle2X ) {
      let newHandle2X = newX + MIN_GAP;
      // clamp
      newHandle2X = clamp(newHandle2X, minX, maxX);
      handle2X = newHandle2X;
    }
  }

  handle1X = newX;
  applyPositions();
}

/*********************************************
 * (B) moveHandle2
 *********************************************/
function moveHandle2(newX) {
  const rect = container.getBoundingClientRect();
  const cWidth = rect.width;

  const minX = -HANDLE_RADIUS;
  const maxX = cWidth - HANDLE_RADIUS;
  newX = clamp(newX, minX, maxX);

  if (isOrdered()) {
    // boundary2() - MIN_GAP >= boundary1()
    // => (newX+20)-MIN_GAP >= (handle1X+20)
    if ( (newX - MIN_GAP) < handle1X ) {
      let newHandle1X = newX - MIN_GAP;
      newHandle1X = clamp(newHandle1X, minX, maxX);
      handle1X = newHandle1X;
    }
  }

  handle2X = newX;
  applyPositions();
}

/*********************************************
 * (C) Pointer Events
 *********************************************/
handle1.addEventListener('pointerdown', (evt) => {
  isDraggingHandle1 = true;
  handle1.setPointerCapture(evt.pointerId);
});
handle1.addEventListener('pointermove', (evt) => {
  if (!isDraggingHandle1) return;
  const rect = container.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  // Falls wir wollen, dass x= Balkenmitte,
  // subtrahieren wir 20:
  moveHandle1(x - HANDLE_RADIUS);
});
handle1.addEventListener('pointerup', (evt) => {
  isDraggingHandle1 = false;
  handle1.releasePointerCapture(evt.pointerId);
});

handle2.addEventListener('pointerdown', (evt) => {
  isDraggingHandle2 = true;
  handle2.setPointerCapture(evt.pointerId);
});
handle2.addEventListener('pointermove', (evt) => {
  if (!isDraggingHandle2) return;
  const rect = container.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  moveHandle2(x - HANDLE_RADIUS);
});
handle2.addEventListener('pointerup', (evt) => {
  isDraggingHandle2 = false;
  handle2.releasePointerCapture(evt.pointerId);
});

/*********************************************
 * (D) Initialisierung
 *********************************************/
function initPositions() {
  // Containergröße
  const rect = container.getBoundingClientRect();
  const cWidth = rect.width;

  // z.B. handle1X = 25% - 20, handle2X= 75% - 20
  handle1X = 0.25 * cWidth - HANDLE_RADIUS;
  handle2X = 0.75 * cWidth - HANDLE_RADIUS;

  applyPositions();
}

// Wenn die Seite lädt, initialisieren wir
window.addEventListener('load', initPositions);

// Optional: Bei Fenster-Resize 
// nur clampen oder komplett neu berechnen
window.addEventListener('resize', () => {
  // 1) Positionen beibehalten, nur clampen
  //    (verhindert, dass Griffe aus dem Container rutschen)
  const rect = container.getBoundingClientRect();
  const cWidth = rect.width;
  const minX = -HANDLE_RADIUS;
  const maxX = cWidth - HANDLE_RADIUS;
  
  handle1X = clamp(handle1X, minX, maxX);
  handle2X = clamp(handle2X, minX, maxX);
  
  applyPositions();

  // 2) Alternativ: 
  // initPositions(); 
  // (dann Griffe springen wieder auf 25% / 75%)
});
