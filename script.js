// Initialize Matter.js modules
const { Engine, Render, World, Bodies, Body, Mouse, Vector, Events } = Matter;

// Create engine and world with modified properties
const engine = Engine.create({
    enableSleeping: false,
    constraintIterations: 4,
    positionIterations: 6,
    velocityIterations: 4
});

// Constants for gravity
const GRAVITY_VALUE = 0.5; // Increased from 0.001 to 0.003 for stronger gravity

// Set initial gravity
engine.world.gravity.y = GRAVITY_VALUE;
engine.world.gravity.x = 0;
let gravityEnabled = true;

// Disable air friction
engine.world.airFriction = 0;

const world = engine.world;

// Setup canvas
const canvas = document.getElementById('canvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#000000'
    }
});

// Add walls to keep shapes inside
const wallThickness = 60; // Increased thickness for better containment
const walls = [
    Bodies.rectangle(window.innerWidth/2, -wallThickness/2, window.innerWidth, wallThickness, { isStatic: true }), // top
    Bodies.rectangle(window.innerWidth/2, window.innerHeight + wallThickness/2, window.innerWidth, wallThickness, { isStatic: true }), // bottom
    Bodies.rectangle(-wallThickness/2, window.innerHeight/2, wallThickness, window.innerHeight, { isStatic: true }), // left
    Bodies.rectangle(window.innerWidth + wallThickness/2, window.innerHeight/2, wallThickness, window.innerHeight, { isStatic: true }) // right
];
World.add(world, walls);

// Mouse tracking variables
let mousePos = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let mouseVelocity = { x: 0, y: 0 };

// Track mouse movement
document.addEventListener('mousemove', (e) => {
    lastMousePos = { ...mousePos };
    mousePos = { x: e.clientX, y: e.clientY };
    mouseVelocity = {
        x: mousePos.x - lastMousePos.x,
        y: mousePos.y - lastMousePos.y
    };
});

// Add after the gravity toggle code
const themeToggle = document.getElementById('theme-toggle');
let isDarkTheme = true;

themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme');
    
    // Add animation class
    themeToggle.classList.add('theme-transition');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        themeToggle.classList.remove('theme-transition');
    }, 500);
    
    // Update canvas background
    render.options.background = isDarkTheme ? '#000000' : '#FFFFFF';
    
    // Update shape colors
    const bodies = world.bodies.filter(body => !body.isStatic);
    bodies.forEach(body => {
        if (body.render.fillStyle === '#FFFFFF') {
            body.render.fillStyle = '#000000';
        } else if (body.render.fillStyle === '#000000') {
            body.render.fillStyle = '#FFFFFF';
        }
    });
});

// Shape creation functions
const createShape = (type) => {
    const x = window.innerWidth / 2;
    const y = 100;
    let shape;

    const commonProperties = {
        restitution: 0.8,
        friction: 0.2,
        frictionAir: 0,
        frictionStatic: 0,
        render: {
            fillStyle: isDarkTheme ? '#FFFFFF' : '#000000'
        }
    };

    switch(type) {
        case 'circle':
            shape = Bodies.circle(x, y, 30, commonProperties);
            break;
        case 'square':
            shape = Bodies.rectangle(x, y, 60, 60, commonProperties);
            break;
        case 'rectangle':
            shape = Bodies.rectangle(x, y, 80, 40, commonProperties);
            break;
        case 'triangle':
            shape = Bodies.polygon(x, y, 3, 35, commonProperties);
            break;
        case 'pentagon':
            shape = Bodies.polygon(x, y, 5, 35, commonProperties);
            break;
    }

    World.add(world, shape);
}

// Function to check if mouse is near a body
function isMouseNearBody(body) {
    const bounds = body.bounds;
    const mouseRadius = 5; // Detection radius around mouse
    return (mousePos.x + mouseRadius >= bounds.min.x &&
            mousePos.x - mouseRadius <= bounds.max.x &&
            mousePos.y + mouseRadius >= bounds.min.y &&
            mousePos.y - mouseRadius <= bounds.max.y);
}

// Function to keep bodies within bounds
function keepShapesInBounds() {
    const bodies = world.bodies.filter(body => !body.isStatic);
    const padding = 20;
    
    bodies.forEach(body => {
        const pos = body.position;
        const vel = body.velocity;
        
        if (pos.x < padding || pos.x > window.innerWidth - padding) {
            Body.setVelocity(body, { x: -vel.x * 0.5, y: vel.y });
            Body.setPosition(body, {
                x: Math.max(padding, Math.min(window.innerWidth - padding, pos.x)),
                y: pos.y
            });
        }
        
        if (pos.y < padding || pos.y > window.innerHeight - padding) {
            Body.setVelocity(body, { x: vel.x, y: -vel.y * 0.5 });
            Body.setPosition(body, {
                x: pos.x,
                y: Math.max(padding, Math.min(window.innerHeight - padding, pos.y))
            });
        }
    });
}

// Simple gravity toggle functionality
const gravityToggle = document.getElementById('gravity-toggle');

gravityToggle.addEventListener('click', () => {
    gravityEnabled = !gravityEnabled;
    gravityToggle.classList.toggle('disabled');
    engine.world.gravity.y = gravityEnabled ? GRAVITY_VALUE : 0;
});

// Update physics based on mouse movement
Events.on(engine, 'beforeUpdate', () => {
    const bodies = world.bodies.filter(body => !body.isStatic);
    const forceMultiplier = 0.05;
    
    bodies.forEach(body => {
        if (isMouseNearBody(body)) {
            Body.applyForce(body, body.position, {
                x: mouseVelocity.x * forceMultiplier,
                y: mouseVelocity.y * forceMultiplier
            });
        }
    });

    keepShapesInBounds();
});

// UI Event Listeners
const plusIcon = document.getElementById('plus-icon');
const shapeMenu = document.getElementById('shape-menu');

plusIcon.addEventListener('click', () => {
    shapeMenu.classList.toggle('hidden');
});

document.querySelectorAll('.shape-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const shapeType = e.currentTarget.getAttribute('data-shape');
        createShape(shapeType);
        shapeMenu.classList.add('hidden');
    });
});

// Update the more button functionality
const moreButton = document.getElementById('more-button');
const moreMenu = document.getElementById('more-menu');
const moreIcon = moreButton.querySelector('.more-icon');

moreButton.addEventListener('click', (e) => {
    e.stopPropagation();
    moreButton.classList.toggle('expanded');
    moreMenu.classList.toggle('hidden');
    moreIcon.textContent = moreButton.classList.contains('expanded') ? '^' : 'ˇ';
});

// Update the document click handler
document.addEventListener('click', (e) => {
    if (!plusIcon.contains(e.target)) {
        shapeMenu.classList.add('hidden');
        if (moreMenu) {
            moreMenu.classList.add('hidden');
            moreButton.classList.remove('expanded');
            moreIcon.textContent = 'ˇ';
        }
    }
});

// Function to add new items to the more menu
function addMoreMenuItem(id, label, callback) {
    const item = document.createElement('div');
    item.className = 'shape-option';
    item.id = id;
    
    // You can customize the appearance of each item
    item.innerHTML = `
        <div class="more-item-content">
            ${label}
        </div>
    `;
    
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        callback();
        shapeMenu.classList.add('hidden');
        moreMenu.classList.add('hidden');
        moreButton.classList.remove('expanded');
    });
    
    moreMenu.appendChild(item);
}

// Example of how to add new items (you can add your own later)
// addMoreMenuItem('special-shape', 'Special Shape', () => {
//     // Add your special shape creation logic here
// });

// Handle window resize
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;
});

// Start the engine and renderer
Engine.run(engine);
Render.run(render); 