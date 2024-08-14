<h1>ReapCard - Rapid Prototyping for Card Layouts</h1>

<h2>Overview</h2>

<p><strong>ReapCard</strong> is a web-based tool that allows users to quickly design and generate custom card layouts using a flexible canvas interface. It supports adding various elements like text, images, and boxes, importing data from Excel files, and batch-generating cards based on the provided layout and data.</p>

<h2>Features</h2>
<img src="https://github.com/skyboard89/ReapCard/blob/main/docs/Overview-Image.png">
<ul>
    <li><strong>Canvas-Based Design:</strong> Design your card layouts on a canvas with customizable dimensions, colors, and more.</li>
    <li><strong>Element Addition:</strong> Add boxes, text, images, and placeholders to your design.</li>
    <li><strong>Undo/Redo Support:</strong> Easily correct mistakes with undo and redo functionality.</li>
    <li><strong>Layout Saving/Loading:</strong> Save your layouts as JSON files and reload them later for further editing.</li>
    <li><strong>Excel Integration:</strong> Import data from Excel files to dynamically generate cards.</li>
    <li><strong>XLSX Template Generation:</strong> Automatically generate an Excel template based on your layout elements.</li>
    <li><strong>Batch Card Generation:</strong> Generate cards in bulk, either as individual PNGs or arranged on A4 sheets.</li>
    <li><strong>Preview Functionality:</strong> Preview the first card based on your current layout and data.</li>
    <li><strong>Image Handling:</strong> Upload multiple images and dynamically insert them into your cards during generation.</li>
</ul>

<h2>Installation</h2>

<p>Clone this repository to your local machine:</p>

<pre><code>git clone https://github.com/yourusername/reapcard.git</code></pre>

<p>Navigate to the project directory:</p>

<pre><code>cd reapcard</code></pre>

<p>Open <code>ReapCard.html</code> in your preferred web browser to start using the tool.</p>

<h2>Usage</h2>

<ol>
    <li><strong>Design Your Layout:</strong> Use the tools provided to add boxes, text, images, and image placeholders to the canvas.</li>
    <li><strong>Upload Your Data:</strong> Upload an Excel file containing the data for your cards.</li>
    <li><strong>Upload Images:</strong> Upload images that will be used in your card designs.</li>
    <li><strong>Preview Your Card:</strong> Use the preview feature to see how your first card will look based on the layout and data.</li>
    <li><strong>Generate Cards:</strong> Choose the output format (single PNGs or multiple on A4) and generate your cards.</li>
    <li><strong>Save Your Layout:</strong> Save your layout as a JSON file for future edits.</li>
</ol>

<h2>Project Structure</h2>

<ul>
    <li><code>ReapCard.html</code>: The main HTML file that structures the web application.</li>
    <li><code>ReapCardstyles.css</code>: The CSS file that styles the interface of the application.</li>
    <li><code>ReapCardscript.js</code>: The JavaScript file that contains the logic for card design, element addition, canvas manipulation, and card generation.</li>
</ul>

<h2>Dependencies</h2>

<p>The project uses the following libraries:</p>
<ul>
    <li><a href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">Font Awesome</a> for icons.</li>
    <li><a href="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js">XLSX.js</a> for Excel file manipulation.</li>
</ul>

<h2>Contributing</h2>

<p>Contributions are welcome!</p>

<h2>License</h2>

<p>This project is licensed under the MIT License - see the <a href="LICENSE">LICENSE</a> file for details.</p>
