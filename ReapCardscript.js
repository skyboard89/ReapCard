// Layout-Editor-Funktionalität
const canvas = document.getElementById('layout-canvas');
const ctx = canvas.getContext('2d');
const elements = [];
// Globale Variable für den Image Uplaod
let cardData = [];
let imageFiles = {};

if (!canvas) {
    console.error('Canvas-Element nicht gefunden');
}
if (!ctx) {
    console.error('2D-Kontext nicht verfügbar');
}

ctx.font = '16px Arial';

function addElement(type, x, y, width, height, content, options = {}) {
    elements.push({ type, x, y, width, height, content, ...options });
    redrawCanvas();
}

const history = [];
let currentStep = -1;

function saveState() {
    currentStep++;
    history.splice(currentStep);
    history.push(JSON.parse(JSON.stringify(elements)));
}

function undo() {
    if (currentStep > 0) {
        currentStep--;
        elements.length = 0;
        elements.push(...JSON.parse(JSON.stringify(history[currentStep])));
        redrawCanvas();
    }
}

function redo() {
    if (currentStep < history.length - 1) {
        currentStep++;
        elements.length = 0;
        elements.push(...JSON.parse(JSON.stringify(history[currentStep])));
        redrawCanvas();
    }
}

// Modify the addElement function to save state after adding an element
function addElement(type, x, y, width, height, content, options = {}) {
    elements.push({ type, x, y, width, height, content, ...options });
    redrawCanvas();
    saveState(); // Add this line
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedElement = elements.find(el => 
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
    );
    
    if (clickedElement && (clickedElement.type === 'text' || clickedElement.type === 'box' || clickedElement.type === 'image-box')) {
        showEditMenu(clickedElement, e.clientX, e.clientY);
    }
});

// Add these lines at the end of the mouseup event listener for drag and resize operations
canvas.addEventListener('mouseup', () => {
    if (isDragging || isResizing) {
        saveState(); // Save state after drag or resize operation
    }
    isDragging = false;
    isResizing = false;
    currentElement = null;
});

// Modify the event listener for removing elements to save state
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const index = elements.findIndex(el => 
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
    );
    
    if (index !== -1) {
        elements.splice(index, 1);
        redrawCanvas();
        saveState(); // Add this line
    }
});

document.getElementById('apply-canvas-settings').addEventListener('click', function () {
    const newWidth = document.getElementById('canvas-width').value;
    const newHeight = document.getElementById('canvas-height').value;
    const newRadius = document.getElementById('canvas-radius').value;
    const newBgColor = document.getElementById('canvas-bg-color').value;

    // Update canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Update global radius and background color
    canvas.style.borderRadius = `${newRadius}px`;
    canvas.style.backgroundColor = newBgColor;

    // Adjust the border color for better visibility
    ctx.strokeStyle = (newBgColor === '#ffffff') ? '#000000' : '#000000'; // Adjust color logic as needed

    // Redraw canvas with new settings
    redrawCanvas();
});

// Function to calculate the grid size for A4
function calculateGridSize() {
    const a4Width = 2480; // A4 width at 300 DPI
    const a4Height = 3508; // A4 height at 300 DPI
    const cardWidth = canvas.width;
    const cardHeight = canvas.height;
    
    const cols = Math.floor(a4Width / cardWidth);
    const rows = Math.floor(a4Height / cardHeight);

    return { rows, cols };
}

// Update the grid info display
function updateGridInfo() {
    const { rows, cols } = calculateGridSize();
    const gridInfoDiv = document.getElementById('grid-info');
    gridInfoDiv.textContent = `Fits: ${cols}x${rows} grid on A4`;
}

// Call this function whenever the canvas size changes
document.getElementById('apply-canvas-settings').addEventListener('click', updateGridInfo);

// Also, call it on page load to show the default value
window.addEventListener('load', updateGridInfo);

// Angepasste redrawCanvas-Funktion mit dynamischer Schriftgröße
function redrawCanvas() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set the background color of the canvas
    ctx.fillStyle = canvas.style.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    elements.forEach(element => {
    if (element.type === 'text' || element.type === 'box' || element.type === 'image-box') {
        ctx.fillStyle = element.backgroundColor || 'white';
        if (element.type === 'box') {
            roundRect(ctx, element.x, element.y, element.width, element.height, 10, true, true);
        } else if (element.type === 'text') {
            // Gestrichelter Rahmen für Text
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(element.x, element.y, element.width, element.height);
            ctx.setLineDash([]);
        }  else if (element.type === 'image-box') {
            // Zeichne ein Kreuz in der Bild-Box
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(element.x + element.width, element.y + element.height);
            ctx.moveTo(element.x + element.width, element.y);
            ctx.lineTo(element.x, element.y + element.height);
            ctx.stroke();
        } else {
            ctx.fillStyle = element.fontColor || 'black';
            fitTextToBox(ctx, element.content, element.x, element.y, element.width, element.height);
        }

        // Dynamische Anpassung der Schriftgröße
        let fontSize = Math.min(element.width, element.height); // Beispielwerte, passe sie nach Bedarf an
        let padding = 5; // Beispielwert, passe ihn nach Bedarf an
        ctx.font = `${fontSize}px Arial`;
        let textMetrics = ctx.measureText(element.content);
        while ((textMetrics.width > element.width - 2 * padding || fontSize > element.height - 2 * padding) && fontSize > 0) {
            fontSize--;
            ctx.font = `${fontSize}px Arial`;
            textMetrics = ctx.measureText(element.content);
        }

        const textX = element.x + element.width / 2;
        const textY = element.y + element.height / 2;
        ctx.textBaseline = 'middle'; // Text vertikal zentrieren
        ctx.textAlign = 'center'; // Text horizontal zentrieren
        ctx.fillStyle = element.fontColor || 'black';
        ctx.fillText(element.content, textX, textY);
    } else if (element.type === 'image' && element.image) {
        ctx.drawImage(element.image, element.x, element.y, element.width, element.height);
    }
    const handleSize = 15; // Increase handle size
    ctx.fillStyle = 'black';
    ctx.fillRect(element.x + element.width - handleSize / 2, element.y + element.height - handleSize / 2, handleSize, handleSize);
});
}





function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

// Funktion zum Hinzufügen einer Box (vereinfacht)
function addBox() {
    addElement('box', 50, 50, 100, 50, 'Box', { fontColor: 'black', backgroundColor: 'white' });
}

// Funktion zum Anzeigen des Bearbeitungsmenüs
function showEditMenu(element, x, y) {
    // Remove any existing menu
    const oldMenu = document.querySelector('.edit-menu');
    if (oldMenu) {
        oldMenu.remove();
    }

    // Create a new menu
    const menu = document.createElement('div');
    menu.className = 'edit-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid black';
    menu.style.padding = '5px';
    menu.style.zIndex = '1000';

    // Name input field (common for all types)
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Name:';
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = element.content;
    textInput.addEventListener('change', () => {
        element.content = textInput.value;
        redrawCanvas();
        saveState();
    });

    // Append the name input field to the menu
    menu.appendChild(textLabel);
    menu.appendChild(textInput);

    // Additional settings for box and text elements
    if (element.type !== 'image-box') {
        // Font color picker
        const fontColorLabel = document.createElement('label');
        fontColorLabel.textContent = 'Text Color:';
        const fontColorPicker = document.createElement('input');
        fontColorPicker.type = 'color';
        fontColorPicker.value = element.fontColor || '#000000';
        fontColorPicker.addEventListener('input', (event) => {
            element.fontColor = event.target.value;
            redrawCanvas();
            saveState();
        });

        // Background color picker
        const bgColorLabel = document.createElement('label');
        bgColorLabel.textContent = 'Background Color:';
        const bgColorPicker = document.createElement('input');
        bgColorPicker.type = 'color';
        bgColorPicker.value = element.backgroundColor || '#FFFFFF';
        bgColorPicker.addEventListener('input', (event) => {
            element.backgroundColor = event.target.value;
            redrawCanvas();
            saveState();
        });

        // Append additional settings to the menu
        menu.appendChild(fontColorLabel);
        menu.appendChild(fontColorPicker);
        menu.appendChild(bgColorLabel);
        menu.appendChild(bgColorPicker);
    }

    // Append the menu to the document body
    document.body.appendChild(menu);

    // Remove the menu when clicking outside
    const removeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', removeMenu), 0);
}



// Bild hinzufügen
function addImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                const element = { 
                    type: 'image', 
                    x: 50, 
                    y: 50, 
                    width: 100, 
                    height: 100, 
                    content: '', 
                    image: img,
                    imageSrc: img.src  // Speichern der Bild-URL
                };
                elements.push(element);
                redrawCanvas();
                saveState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// Drag-and-Drop-Funktionalität
let isDragging = false;
let isResizing = false;
let currentElement = null;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentElement = elements.find(el => 
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
    );

    if (currentElement) {
        const handleSize = 15; // Match the handle size here
        const resizeHandleX = currentElement.x + currentElement.width - handleSize / 2;
        const resizeHandleY = currentElement.y + currentElement.height - handleSize / 2;

        if (x >= resizeHandleX && x <= resizeHandleX + handleSize && y >= resizeHandleY && y <= resizeHandleY + handleSize) {
            isResizing = true;
        } else {
            isDragging = true;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && currentElement) {
        const rect = canvas.getBoundingClientRect();
        currentElement.x = e.clientX - rect.left - currentElement.width / 2;
        currentElement.y = e.clientY - rect.top - currentElement.height / 2;
        redrawCanvas();
    } else if (isResizing && currentElement) {
        const rect = canvas.getBoundingClientRect();
        currentElement.width = e.clientX - rect.left - currentElement.x;
        currentElement.height = e.clientY - rect.top - currentElement.y;
        redrawCanvas();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    currentElement = null;
});

// Box entfernen
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const index = elements.findIndex(el => 
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
    );
    
    if (index !== -1) {
        elements.splice(index, 1);
        redrawCanvas();
    }
});


// Funktion zum Speichern des Layouts als JSON
function saveLayoutAsJSON() {
    const layout = {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasBackgroundColor: canvas.style.backgroundColor || '#ffffff',
        canvasBorderRadius: parseInt(canvas.style.borderRadius) || 0,
        elements: elements.map(el => {
            if (el.type === 'image' && el.image) {
                return { ...el, imageSrc: el.image.src, image: null };
            }
            return el;
        }),
        version: "1.3" // Increment version to track this change
    };
    const json = JSON.stringify(layout);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "card_layout.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// Funktion zum Laden des Layouts aus JSON
function loadLayoutFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const layout = JSON.parse(event.target.result);
            if (layout.version === "1.3") {
                // Restore canvas settings
                canvas.width = layout.canvasWidth;
                canvas.height = layout.canvasHeight;
                canvas.style.backgroundColor = layout.canvasBackgroundColor;
                canvas.style.borderRadius = `${layout.canvasBorderRadius}px`;

                // Update the UI inputs with the loaded canvas settings
                document.getElementById('canvas-width').value = layout.canvasWidth;
                document.getElementById('canvas-height').value = layout.canvasHeight;
                document.getElementById('canvas-radius').value = layout.canvasBorderRadius;

                // Convert RGB to Hex if necessary
                const backgroundColor = layout.canvasBackgroundColor;
                const hexColor = rgbToHex(backgroundColor);

                // Update the background color picker with the correct value
                const colorPicker = document.getElementById('canvas-bg-color');
                colorPicker.value = hexColor;

                // Restore elements
                elements.length = 0;
                const imagePromises = layout.elements.map(el => {
                    if (el.type === 'image' && el.imageSrc) {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                el.image = img;
                                resolve(el);
                            };
                            img.src = el.imageSrc;
                        });
                    }
                    return Promise.resolve(el);
                });

                Promise.all(imagePromises).then(loadedElements => {
                    elements.push(...loadedElements);
                    redrawCanvas(); // Ensure all elements are redrawn with the correct settings
                    saveState();
                });

                // Update the grid information after loading the layout
                updateGridInfo(); // This line ensures the grid info is updated

            } else {
                alert("Unsupported layout version.");
            }
        } catch (error) {
            alert("Error loading layout: " + error.message);
        }
    };
    reader.readAsText(file);
}
// Utility function to convert RGB to Hex
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb; // If it's already hex, return it directly

    const rgbArray = rgb.match(/\d+/g).map(Number);
    if (rgbArray && rgbArray.length >= 3) {
        const r = rgbArray[0].toString(16).padStart(2, '0');
        const g = rgbArray[1].toString(16).padStart(2, '0');
        const b = rgbArray[2].toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#ffffff'; // Fallback to white if there's an issue
}

// Batch-Verarbeitung und PNG-Generierung

const xlsxUpload = document.getElementById('xlsx-upload');
const generateButton = document.getElementById('generate-cards');
const progressBar = document.getElementById('progress-bar');
const outputFormatSelect = document.getElementById('output-format');



// Initial message when the page loads
document.getElementById('xlsx-upload-status').style.display = 'block';
document.getElementById('uploaded-xlsx-status-text').textContent = 'No file uploaded';
document.getElementById('uploaded-xlsx-status-text').style.color = 'red';

// XLSX-Datei einlesen
xlsxUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                cardData = XLSX.utils.sheet_to_json(worksheet);
                console.log('Kartendaten geladen:', cardData);

                // Display the checkmark and file name
                document.getElementById('uploaded-xlsx-status-text').textContent = `Uploaded: ${file.name}`;
                document.getElementById('uploaded-xlsx-status-text').style.color = 'green';
            } catch (error) {
                console.error('Error reading XLSX file:', error);
                document.getElementById('uploaded-xlsx-status-text').textContent = 'Error reading file';
                document.getElementById('uploaded-xlsx-status-text').style.color = 'red';
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        document.getElementById('uploaded-xlsx-status-text').textContent = 'No file uploaded';
        document.getElementById('uploaded-xlsx-status-text').style.color = 'red';
    }
});

// XLSX-Datei einlesen
xlsxUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            cardData = XLSX.utils.sheet_to_json(worksheet);
            console.log('Kartendaten geladen:', cardData);

            // Display the checkmark and file name
            document.getElementById('uploaded-xlsx-name').textContent = file.name;
            document.getElementById('xlsx-upload-status').style.display = 'block';
        };
        reader.readAsArrayBuffer(file);
    }
});

// Function to create an XLSX template based on the canvas elements
function generateXLSXTemplate() {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [];
    const headers = [];

    // Extract the relevant elements from the canvas
    elements.forEach(element => {
        if (element.type === 'text' || element.type === 'box' || element.type === 'image-box') {
            headers.push(element.content); // Use the content as the header name
        }
    });

    // Remove duplicates and create headers row
    const uniqueHeaders = [...new Set(headers)];
    worksheetData.push(uniqueHeaders);

    // Create a worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Generate XLSX file
    const xlsxFile = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Trigger the download
    const blob = new Blob([xlsxFile], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'card_template.xlsx';
    a.click();
    URL.revokeObjectURL(a.href);
}

// Event listener for the button
document.getElementById('generate-xlsx-template').addEventListener('click', generateXLSXTemplate);


// New function to handle image file uploads
function handleImageUpload(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        imageFiles[file.name] = file;
    }
    console.log('Bilderdaten geladen:', Object.keys(imageFiles));
    // Prevent any potential default behavior
    event.preventDefault();
}

// Add a new file input for images
const imageUpload = document.createElement('input');
imageUpload.type = 'file';
imageUpload.multiple = true;
imageUpload.accept = 'image/*';
imageUpload.style.display = 'none'; // Hide the input
imageUpload.addEventListener('change', handleImageUpload);
document.body.appendChild(imageUpload); // Append to the document

const uploadPicturesButton = document.getElementById('upload-images');
uploadPicturesButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent any default behavior
    console.log('Button clicked');
    imageUpload.click();
});

//upload pictures to canvas
async function loadImage(imageName) {
    return new Promise((resolve, reject) => {
        if (!imageName) {
            reject(new Error('Kein Bildname angegeben'));
            return;
        }

        const file = imageFiles[imageName];
        if (!file) {
            reject(new Error(`Bilddatei nicht gefunden: ${imageName}`));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Bild erfolgreich geladen: ${imageName}`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Fehler beim Laden des Bildes: ${imageName}`, error);
                reject(new Error(`Konnte Bild nicht laden: ${imageName}`));
            };
            img.src = event.target.result;
        };
        reader.onerror = (error) => {
            console.error(`Fehler beim Lesen der Bilddatei: ${imageName}`, error);
            reject(new Error(`Fehler beim Lesen der Bilddatei: ${imageName}`));
        };
        reader.readAsDataURL(file);
    });
}

async function generateCard(data) {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = canvas.width; // Use current canvas width
    cardCanvas.height = canvas.height; // Use current canvas height
    const cardCtx = cardCanvas.getContext('2d');

    cardCtx.fillStyle = canvas.style.backgroundColor || 'white';
    cardCtx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

    cardCtx.lineWidth = 2;
    cardCtx.strokeStyle = ctx.strokeStyle || 'black';
    roundRect(cardCtx, 1, 1, cardCanvas.width - 2, cardCanvas.height - 2, parseInt(canvas.style.borderRadius) || 0, false, true);

    for (const element of elements) {
        if (element.type === 'text' || element.type === 'box') {
            cardCtx.fillStyle = element.backgroundColor || 'white';
            if (element.type === 'box') {
                roundRect(cardCtx, element.x, element.y, element.width, element.height, parseInt(canvas.style.borderRadius) || 0, true, true);
            }
            
            cardCtx.fillStyle = element.fontColor || 'black';
            const content = data[element.content] || element.content;
            fitTextToBox(cardCtx, content, element.x, element.y, element.width, element.height);
        } else if (element.type === 'image' && element.image) {
            cardCtx.drawImage(element.image, element.x, element.y, element.width, element.height);
        } else if (element.type === 'image-box') {
            const imageName = data[element.content];
            if (imageName) {
                try {
                    const img = await loadImage(imageName);
                    cardCtx.drawImage(img, element.x, element.y, element.width, element.height);
                } catch (error) {
                    cardCtx.fillStyle = 'red';
                    cardCtx.fillRect(element.x, element.y, element.width, element.height);
                    cardCtx.fillStyle = 'white';
                    cardCtx.font = '12px Arial';
                    cardCtx.fillText('Image Load Error', element.x + 5, element.y + 20);
                }
            } else {
                cardCtx.fillStyle = 'yellow';
                cardCtx.fillRect(element.x, element.y, element.width, element.height);
                cardCtx.fillStyle = 'black';
                cardCtx.font = '12px Arial';
                cardCtx.fillText('No Image Name', element.x + 5, element.y + 20);
            }
        }
    }

    return new Promise((resolve) => {
        cardCanvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}


function fitTextToBox(ctx, text, x, y, width, height) {
    // Convert text to string and handle undefined/null cases
    text = String(text || '');
    
    const padding = 5;
    let fontSize = Math.min(height, width) / 2; // Start with a large font size
    ctx.font = `${fontSize}px Arial`;

    let lines = [];
    let currentLine = '';
    const words = text.split(' ');

    while (fontSize > 8) { // Minimum font size
        lines = [];
        currentLine = '';
        for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > width - 2 * padding) {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        if (lines.length * fontSize <= height - 2 * padding) {
            break;
        }
        fontSize--;
        ctx.font = `${fontSize}px Arial`;
    }

    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    let offsetY = y + (height - totalTextHeight) / 2 + fontSize;

    for (let line of lines) {
        const lineWidth = ctx.measureText(line).width;
        const offsetX = x + (width - lineWidth) / 2;
        ctx.fillText(line.trim(), offsetX, offsetY);
        offsetY += lineHeight;
    }
}

// Function to generate cards on A4 based on dynamic grid size
async function generateCardsOnA4(cardBlobs) {
    const { rows, cols } = calculateGridSize();
    const totalCardsPerPage = rows * cols;

    const a4Canvas = document.createElement('canvas');
    a4Canvas.width = 2480; // A4 width at 300 DPI
    a4Canvas.height = 3508; // A4 height at 300 DPI
    const a4Ctx = a4Canvas.getContext('2d');

    a4Ctx.fillStyle = 'white';
    a4Ctx.fillRect(0, 0, a4Canvas.width, a4Canvas.height);

    // Get the spacing option
    const addSpacing = document.getElementById('card-spacing-toggle').checked;
    const margin = addSpacing ? 20 : 0;

    const marginX = (a4Canvas.width - (cols * canvas.width + (cols - 1) * margin)) / 2;
    const marginY = (a4Canvas.height - (rows * canvas.height + (rows - 1) * margin)) / 2;

    let loadedImages = 0;

    for (let i = 0; i < cardBlobs.length; i++) {
        const img = new Image();

        img.onload = () => {
            const row = Math.floor((loadedImages % totalCardsPerPage) / cols);
            const col = loadedImages % cols;
            const x = marginX + col * (canvas.width + margin);
            const y = marginY + row * (canvas.height + margin);
            a4Ctx.drawImage(img, x, y, canvas.width, canvas.height);

            loadedImages++;

            // If this is the last card on the page or the last card in the batch
            if (loadedImages % totalCardsPerPage === 0 || loadedImages === cardBlobs.length) {
                a4Canvas.toBlob((a4Blob) => {
                    if (a4Blob) {
                        const a = document.createElement('a');
                        const objectURL = URL.createObjectURL(a4Blob);
                        a.href = objectURL;
                        a.download = `a4_page_${Math.ceil(loadedImages / totalCardsPerPage)}.png`;
                        a.click();
                        URL.revokeObjectURL(objectURL);
                    } else {
                        console.error("Failed to create blob for A4 page");
                        alert("Fehler bei der Kartengenerierung: Konnte Blob nicht erstellen.");
                    }
                }, 'image/png');
            }

            // Reset the canvas for the next page if needed
            if (loadedImages % totalCardsPerPage === 0 && loadedImages < cardBlobs.length) {
                a4Ctx.clearRect(0, 0, a4Canvas.width, a4Canvas.height);
                a4Ctx.fillStyle = 'white';
                a4Ctx.fillRect(0, 0, a4Canvas.width, a4Canvas.height);
            }
        };

        img.onerror = (error) => {
            console.error("Failed to load image for card generation", error);
            alert("Fehler bei der Kartengenerierung: Konnte Bild nicht laden.");
        };

        img.src = URL.createObjectURL(cardBlobs[i]);
    }
}

/// Batch-Verarbeitung aller Karten
generateButton.addEventListener('click', async () => {
    if (cardData.length === 0) {
        alert('Bitte laden Sie zuerst eine XLSX-Datei hoch.');
        return;
    }

    if (Object.keys(imageFiles).length === 0) {
        alert('Bitte laden Sie zuerst die Bilddateien hoch.');
        return;
    }

    const totalCards = cardData.length;
    progressBar.max = totalCards;
    progressBar.value = 0;

    const outputFormat = outputFormatSelect.value;
    const cardBlobs = [];

    try {
        for (let i = 0; i < totalCards; i++) {
            const cardBlob = await generateCard(cardData[i]);
            cardBlobs.push(cardBlob);
            progressBar.value = i + 1;
        }

        if (outputFormat === 'single') {
            for (let i = 0; i < cardBlobs.length; i++) {
                const a = document.createElement('a');
                const objectURL = URL.createObjectURL(cardBlobs[i]);
                a.href = objectURL;
                a.download = `card_${i + 1}.png`;
                a.click();
                URL.revokeObjectURL(objectURL);
            }
        } else if (outputFormat === 'a4') {
            await generateCardsOnA4(cardBlobs);
        }

        alert('Kartengenerierung abgeschlossen!');
    } catch (error) {
        console.error("Error during card generation:", error);
        alert("Fehler bei der Kartengenerierung: " + error.message);
    }
});

// Vorschaufunktion
async function previewCard(data) {
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvas.width; // Use current canvas width
    previewCanvas.height = canvas.height; // Use current canvas height
    const previewCtx = previewCanvas.getContext('2d');

    previewCtx.fillStyle = canvas.style.backgroundColor || 'white';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    previewCtx.lineWidth = 2;
    previewCtx.strokeStyle = ctx.strokeStyle || 'black';
    roundRect(previewCtx, 1, 1, previewCanvas.width - 2, previewCanvas.height - 2, parseInt(canvas.style.borderRadius) || 0, false, true);

    for (const element of elements) {
        if (element.type === 'text' || element.type === 'box') {
            previewCtx.fillStyle = element.backgroundColor || 'white';
            if (element.type === 'box') {
                roundRect(previewCtx, element.x, element.y, element.width, element.height, parseInt(canvas.style.borderRadius) || 0, true, true);
            }
            
            previewCtx.fillStyle = element.fontColor || 'black';
            const content = data[element.content] || element.content;
            fitTextToBox(previewCtx, content, element.x, element.y, element.width, element.height);
        } else if (element.type === 'image' && element.image) {
            previewCtx.drawImage(element.image, element.x, element.y, element.width, element.height);
        } else if (element.type === 'image-box') {
            const imageName = data[element.content];
            if (imageName) {
                try {
                    const img = await loadImage(imageName);
                    previewCtx.drawImage(img, element.x, element.y, element.width, element.height);
                } catch (error) {
                    previewCtx.fillStyle = 'red';
                    previewCtx.fillRect(element.x, element.y, element.width, element.height);
                    previewCtx.fillStyle = 'white';
                    previewCtx.font = '12px Arial';
                    previewCtx.fillText('Image Load Error', element.x + 5, element.y + 20);
                }
            } else {
                previewCtx.fillStyle = 'yellow';
                previewCtx.fillRect(element.x, element.y, element.width, element.height);
                previewCtx.fillStyle = 'black';
                previewCtx.font = '12px Arial';
                previewCtx.fillText('No Image Name', element.x + 5, element.y + 20);
            }
        }
    }

    return previewCanvas;
}


//Bild aus Excel Liste holen
function addImageBox() {
    const imageBox = {
        type: 'image-box',
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        content: 'New Image Box', // Default name
        backgroundColor: 'white'
    };
    elements.push(imageBox);
    redrawCanvas();
    saveState();
    showEditMenu(imageBox, imageBox.x + imageBox.width / 2, imageBox.y + imageBox.height / 2);
}

// Vorschau-Button-Funktionalität
document.getElementById('preview').addEventListener('click', async () => {
    if (cardData.length > 0) {
        const previewCanvas = await previewCard(cardData[0]);
        const previewWindow = window.open('', 'Kartenvorschau', 'width=697,height=1075');
        previewWindow.document.body.appendChild(previewCanvas);
    } else {
        alert('Bitte laden Sie zuerst eine XLSX-Datei hoch.');
    }
});

// Event-Listener für UI-Elemente
document.getElementById('add-box').addEventListener('click', addBox);
document.getElementById('add-text').addEventListener('click', () => {
    addElement('text', 50, 50, 200, 30, 'Neuer Text');
});
document.getElementById('add-image').addEventListener('click', addImage);
document.getElementById('add-image-box').addEventListener('click', addImageBox);
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('save-layout').addEventListener('click', saveLayoutAsJSON);
document.getElementById('load-layout').addEventListener('click', () => document.getElementById('load-layout-input').click());
document.getElementById('load-layout-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadLayoutFromJSON(e.target.files[0]);
    }
});

document.getElementById('canvas-standard-size').addEventListener('change', function () {
    const selectedValue = this.value;
    if (selectedValue) {
        const [width, height] = selectedValue.split(',').map(Number);
        document.getElementById('canvas-width').value = width;
        document.getElementById('canvas-height').value = height;
    }
});

// Collapsible sections
document.addEventListener('DOMContentLoaded', function () {
    var coll = document.getElementsByClassName("collapsible");

    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                content.style.padding = "0"; // Remove padding when collapsed
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                content.style.padding = "18px"; // Add padding when expanded
            }
        });
    }

    // Open "Tools" and "Create Cards" by default
    document.querySelectorAll(".collapsible").forEach(function (collapsible) {
        if (collapsible.textContent.includes("Tools") || collapsible.textContent.includes("Create Cards")) {
            collapsible.classList.add("active");
            var content = collapsible.nextElementSibling;
            content.style.maxHeight = content.scrollHeight + "px";
            content.style.padding = "18px"; // Ensure padding is set when expanded
        }
    });
});

// Initialisierung
saveState();