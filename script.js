// Initialize Socket.IO
const socket = io('http://localhost:3000');
let currentUser = null;
let notifications = [];
let reports = [
    { mobileName: 'Samsung Galaxy S21', lastSeen: 'Bus Station', description: 'Black color, cracked screen', reward: 2000, image: null, category: 'Samsung', timestamp: new Date() },
];

// Function to show a specific slide
function showSlide(slideId) {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => {
        slide.style.display = 'none';
    });

    const activeSlide = document.getElementById(slideId);
    activeSlide.style.display = 'block';

    if (slideId === 'view') {
        loadLostMobiles();
    }
    if (slideId === 'chat') {
        socket.emit('join', 'chat-room');
    }
    if (slideId === 'dashboard') {
        updateDashboard();
    }
}

// Show the dashboard slide by default
showSlide('dashboard');

// Toggle Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Load Dark Mode Preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Show Notifications
function showNotifications() {
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = notifications.length > 0 ? notifications.join('') : '<p>No new notifications.</p>';
    const modal = new bootstrap.Modal(document.getElementById('notification-modal'));
    modal.show();
    document.getElementById('notification-count').textContent = '0';
}

// Add Notification
function addNotification(message) {
    notifications.push(`<p>${message} <span class="text-muted small">${new Date().toLocaleTimeString()}</span></p>`);
    document.getElementById('notification-count').textContent = notifications.length;
}

// Update Dashboard
function updateDashboard() {
    document.getElementById('report-count').textContent = reports.length;
    document.getElementById('chat-count').textContent = 1; // Simulated
    document.getElementById('match-count').textContent = 0; // Simulated
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    const loginError = document.getElementById('login-error');
    const loginSpinner = document.getElementById('login-spinner');

    loginError.style.display = 'none';
    loginSpinner.style.display = 'inline-block';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('token', result.token);
            if (rememberMe) {
                localStorage.setItem('username', username);
            }
            currentUser = username;
            loginError.style.display = 'none';
            addNotification('You have logged in successfully.');
            showSlide('dashboard');
        } else {
            loginError.style.display = 'block';
            loginError.textContent = result.message;
        }
    } catch (error) {
        loginError.style.display = 'block';
        loginError.textContent = 'Error connecting to the server.';
    }
    loginSpinner.style.display = 'none';
});

// Handle register form submission
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const registerError = document.getElementById('register-error');
    const registerSpinner = document.getElementById('register-spinner');

    registerError.style.display = 'none';
    registerSpinner.style.display = 'inline-block';

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        if (result.success) {
            registerError.style.display = 'none';
            addNotification('Registration successful! Please login.');
        } else {
            registerError.style.display = 'block';
            registerError.textContent = result.message;
        }
    } catch (error) {
        registerError.style.display = 'block';
        registerError.textContent = 'Error connecting to the server.';
    }
    registerSpinner.style.display = 'none';
});

// Handle report form submission
document.getElementById('report-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const category = document.getElementById('mobile-category').value;
    const mobileName = document.getElementById('mobile-name').value;
    const lastSeen = document.getElementById('last-seen').value;
    const description = document.getElementById('description').value;
    const reward = document.getElementById('reward').value;
    const mobileImage = document.getElementById('mobile-image').files[0];
    const reportSuccess = document.getElementById('report-success');

    if (mobileName.length < 3) {
        alert('Mobile name must be at least 3 characters long.');
        return;
    }

    let imageBase64 = null;
    if (mobileImage) {
        imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(mobileImage);
        });
    }

    reports.push({
        mobileName,
        lastSeen,
        description,
        reward: reward ? parseInt(reward) : null,
        image: imageBase64,
        category,
        timestamp: new Date(),
    });

    reportSuccess.style.display = 'block';
    reportSuccess.textContent = 'Report submitted successfully!';
    document.getElementById('report-form').reset();
    addNotification('You have submitted a new lost mobile report.');

    setTimeout(() => {
        reportSuccess.style.display = 'none';
    }, 3000);
});

// Load lost mobiles dynamically
function loadLostMobiles(searchQuery = '', categoryFilter = '', sortOption = 'date-desc') {
    const lostMobilesDiv = document.getElementById('lost-mobiles');
    lostMobilesDiv.innerHTML = '';

    let filteredReports = reports.filter(report =>
        (report.mobileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.lastSeen.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (categoryFilter === '' || report.category === categoryFilter)
    );

    // Sort reports
    filteredReports.sort((a, b) => {
        if (sortOption === 'date-desc') return new Date(b.timestamp) - new Date(a.timestamp);
        if (sortOption === 'date-asc') return new Date(a.timestamp) - new Date(b.timestamp);
        if (sortOption === 'reward-desc') return (b.reward || 0) - (a.reward || 0);
        if (sortOption === 'reward-asc') return (a.reward || 0) - (b.reward || 0);
        return 0;
    });

    filteredReports.forEach(report => {
        lostMobilesDiv.innerHTML += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        ${report.image ? `<img src="${report.image}" alt="Mobile Image" style="max-width: 100px; border-radius: 5px; margin-bottom: 10px;">` : ''}
                        <h5 class="card-title">${report.mobileName}</h5>
                        <p class="card-text">Category: ${report.category}</p>
                        <p class="card-text">Last Seen: ${report.lastSeen}</p>
                        <p class="card-text">Reward: ₹${report.reward || 'N/A'}</p>
                        <button class="btn btn-primary" onclick="contactFinder('${report.mobileName}')">Contact Finder</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Search, filter, and sort functionality for lost mobiles
document.getElementById('search-mobiles').addEventListener('input', updateLostMobiles);
document.getElementById('filter-category').addEventListener('change', updateLostMobiles);
document.getElementById('sort-mobiles').addEventListener('change', updateLostMobiles);

function updateLostMobiles() {
    const searchQuery = document.getElementById('search-m Wobiles').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const sortOption = document.getElementById('sort-mobiles').value;
    loadLostMobiles(searchQuery, categoryFilter, sortOption);
}

// Contact Finder action
function contactFinder(mobileName) {
    showSlide('chat');
    const chatBox = document.querySelector('.chat-box');
    const message = `Hi, I saw your ${mobileName} in the lost mobiles list. Can you confirm it's mine?`;
    chatBox.innerHTML += `<p><strong>${currentUser}:</strong> ${message} <span class="text-muted small">${new Date().toLocaleTimeString()}</span></p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    socket.emit('chatMessage', {
        sender: currentUser,
        receiver: 'Finder',
        message,
        room: 'chat-room',
    });
}

// Select Chat
function selectChat(user) {
    const chatBox = document.querySelector('.chat-box');
    chatBox.innerHTML = `<p><strong>${user}:</strong> Let's continue our conversation. <span class="text-muted small">${new Date().toLocaleTimeString()}</span></p>`;
}

// Handle chat form submission
document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const message = document.getElementById('chat-message').value;
    const chatBox = document.querySelector('.chat-box');
    const typingIndicator = document.getElementById('typing-indicator');

    chatBox.innerHTML += `<p><strong>${currentUser}:</strong> ${message} <span class="text-muted small">${new Date().toLocaleTimeString()}</span></p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    socket.emit('chatMessage', {
        sender: currentUser,
        receiver: 'Finder',
        message,
        room: 'chat-room',
    });

    // Simulate typing indicator
    typingIndicator.style.display = 'block';
    setTimeout(() => {
        typingIndicator.style.display = 'none';
        chatBox.innerHTML += `<p><strong>Finder:</strong> Sure, let me check... <span class="text-muted small">${new Date().toLocaleTimeString()}</span></p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);

    document.getElementById('chat-message').value = '';
});

// Receive chat messages
socket.on('message', (data) => {
    const chatBox = document.querySelector('.chat-box');
    chatBox.innerHTML += `<p><strong>${data.sender}:</strong> ${data.message} <span class="text-muted small">${new Date(data.timestamp).toLocaleTimeString()}</span></p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    addNotification(`New message from ${data.sender}: ${data.message}`);
});

// Clear chat
function clearChat() {
    const chatBox = document.querySelector('.chat-box');
    chatBox.innerHTML = '';
}

// Handle community form submission
document.getElementById('community-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const post = document.getElementById('community-post').value;
    const postSection = document.querySelector('.post');
    postSection.innerHTML += `
        <div class="d-flex align-items-center">
            <div class="avatar me-2">${currentUser ? currentUser[0].toUpperCase() : 'U'}</div>
            <p class="flex-grow-1"><strong>${currentUser}:</strong> ${post} <span class="text-muted small">${new Date().toLocaleTimeString()}</span></p>
            <button class="btn btn-sm btn-outline-secondary" onclick="sharePost('${post}')"><i class="fas fa-share"></i> Share</button>
        </div>
        <div class="d-flex justify-content-between mt-2">
            <button class="btn btn-sm btn-outline-primary" onclick="likePost(this)">Like (0)</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleComment(this)">Comment</button>
        </div>
        <div class="comment-section mt-2" style="display: none;">
            <input type="text" class="form-control mb-2" placeholder="Add a comment...">
            <button class="btn btn-sm btn-primary" onclick="addComment(this)">Post Comment</button>
        </div>
    `;
    document.getElementById('community-post').value = '';
    addNotification('You have posted a new update in the community.');
});

// Like a post
function likePost(button) {
    let likes = parseInt(button.textContent.match(/\d+/)[0]) || 0;
    likes++;
    button.textContent = `Like (${likes})`;
    addNotification('You liked a post in the community.');
}

// Toggle comment section
function toggleComment(button) {
    const commentSection = button.parentElement.nextElementSibling;
    commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
}

// Add a comment
function addComment(button) {
    const commentInput = button.previousElementSibling;
    const commentText = commentInput.value;
    if (commentText) {
        const commentSection = button.parentElement;
        commentSection.innerHTML += `<p class="small mt-2"><strong>${currentUser}:</strong> ${commentText}</p>`;
        commentInput.value = '';
        addNotification('You commented on a post in the community.');
    }
}

// Share a post
function sharePost(post) {
    if (navigator.share) {
        navigator.share({
            title: 'Lost & Found Post',
            text: post,
            url: window.location.href,
        }).then(() => {
            addNotification('Post shared successfully!');
        }).catch(() => {
            alert('Error sharing post.');
        });
    } else {
        alert('Sharing is not supported on this device. Copy the post to share: ' + post);
    }
}

// Handle found mobile form submission
document.getElementById('found-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const mobileName = document.getElementById('found-mobile-name').value;
    const description = document.getElementById('found-description').value;
    const location = document.getElementById('found-location').value;

    foundMobiles.push({ mobileName, description, location });
    document.getElementById('found-form').reset();
    addNotification('You have submitted a found mobile.');
});

// AI Matching
let foundMobiles = [
    { mobileName: 'Samsung Galaxy S21', description: 'Black color, found near the mall', location: 'Mall' },
    { mobileName: 'iPhone 14', description: 'White color, found at the park', location: 'Park' },
];

async function startAIMatching() {
    const aiResults = document.getElementById('ai-results');
    const aiMatchText = document.getElementById('ai-match-text');
    const aiSpinner = document.getElementById('ai-spinner');

    aiSpinner.style.display = 'inline-block';
    aiResults.style.display = 'none';

    setTimeout(() => {
        let matches = [];
        reports.forEach(lost => {
            foundMobiles.forEach(found => {
                const similarity = lost.mobileName.toLowerCase() === found.mobileName.toLowerCase() ? 0.95 : 0.5;
                if (similarity > 0.8) {
                    matches.push(`
                        <div class="mb-2">
                            <p>Match found: ${lost.mobileName} (${(similarity * 100).toFixed(0)}% confidence)</p>
                            <p>Lost: ${lost.lastSeen}, Found: ${found.description}</p>
                            <button class="btn btn-sm btn-primary" onclick="contactFinder('${lost.mobileName}')">Contact Finder</button>
                        </div>
                    `);
                }
            });
        });

        aiSpinner.style.display = 'none';
        aiResults.style.display = 'block';
        aiMatchText.innerHTML = matches.length > 0 ? matches.join('') : 'No matches found.';
        if (matches.length > 0) {
            addNotification('AI Matching found potential matches for your lost mobile!');
        }
    }, 1500);
}



Resources