// Firebase configuration
const firebaseConfig = {
            apiKey: "AIzaSyAEkxTwVTNOiDr5nqJzlF32GIhlts-HpRk",
            authDomain: "edupeak-bea8c.firebaseapp.com",
            projectId: "edupeak-bea8c",
            storageBucket: "edupeak-bea8c.firebasestorage.app",
            messagingSenderId: "783539303255",
            appId: "1:783539303255:web:4bb068761756a756dac412"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginContainer = document.getElementById('login-container');
const adminLoginContainer = document.getElementById('admin-login-container');
const studentDashboard = document.getElementById('student-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');
const lessonsContainer = document.getElementById('lessons-container');
const studentsContainer = document.getElementById('students-container');

// Discord webhook URL for logging
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1421544912704245920/doXyYcU0giT5YJ4MB424yBMg95-ffNlIKqIua-WNVAzt9dSASzNwKxoreA-M--C5rUGU';

// Admin credentials
const ADMIN_PASSWORD = 'phy123';

// Current user
let currentUser = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            checkIfAdmin(user.email);
        } else {
            showLoginPage();
        }
    });

    // Google Login
    document.getElementById('google-login').addEventListener('click', googleLogin);
    
    // Admin Login Link
    document.getElementById('admin-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        showAdminLoginPage();
    });
    
    // Back to Login Link
    document.getElementById('back-to-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });
    
    // Admin Login Button
    document.getElementById('admin-login-btn').addEventListener('click', adminLogin);
    
    // Logout Buttons
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('admin-logout-btn').addEventListener('click', logout);
    
    // Assign Lesson Button
    document.getElementById('assign-lesson-btn').addEventListener('click', assignLesson);
    
    // Custom Lesson Type Buttons
    document.getElementById('add-custom-type-btn').addEventListener('click', showCustomTypeInput);
    document.getElementById('save-custom-type-btn').addEventListener('click', saveCustomType);
});

// Authentication Functions
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            currentUser = result.user;
            saveUserToFirestore(result.user);
            checkIfAdmin(result.user.email);
        })
        .catch(error => {
            console.error('Google login error:', error);
            alert('Login failed. Please try again.');
        });
}

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        showAdminDashboard();
        loadStudents();
    } else {
        alert('Incorrect admin password. Please try again.');
    }
}

function logout() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            showLoginPage();
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
}

// User Management Functions
function saveUserToFirestore(user) {
    db.collection('users').doc(user.email).set({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .catch(error => {
        console.error('Error saving user to Firestore:', error);
    });
}

function checkIfAdmin(email) {
    // Check if the user is an admin
    db.collection('admins').doc(email).get()
        .then(doc => {
            if (doc.exists) {
                showAdminDashboard();
                loadStudents();
            } else {
                showStudentDashboard();
                loadLessons(email);
            }
        })
        .catch(error => {
            console.error('Error checking admin status:', error);
            showStudentDashboard();
            loadLessons(email);
        });
}

// Lesson Management Functions
function assignLesson() {
    const studentEmail = document.getElementById('student-email').value;
    const videoUrl = document.getElementById('video-url').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const lessonType = document.getElementById('lesson-type').value;
    const lessonDescription = document.getElementById('lesson-description').value.trim() || 
        "පාඩම අතරතුරදීම රාත්‍රී 7 සිට 9 දක්වා Zoom මගින්ද සම්බන්ධ වෙන්න. සෑම විනාඩි හෝ මිනිත්තු හැරෙන විනාඩි නැවතීම හැකිය. වැඩිදුර තොරතුරු දැනගැනීම සඳහා Telegram සමූහයට පිවිසෙන්න.";
    
    if (!studentEmail || !videoUrl || !month || !year || !lessonType) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Check if student exists, if not create a new user document
    db.collection('users').doc(studentEmail).get()
        .then((docSnapshot) => {
            if (!docSnapshot.exists) {
                // Create new user
                sendLogToDiscord(`Admin created new student: ${studentEmail}`);
                return db.collection('users').doc(studentEmail).set({
                    email: studentEmail,
                    isAdmin: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            // Add lesson to the lessons collection
            const lessonId = `${year}-${month}-${lessonType}`;
            return db.collection('lessons').doc(lessonId).set({
                month: month,
                year: year,
                type: lessonType,
                videoUrl: videoUrl,
                description: lessonDescription,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        })
        .then(() => {
            // Grant access to the student
            const lessonId = `${year}-${month}-${lessonType}`;
            sendLogToDiscord(`Admin assigned ${month} ${year} lesson (${lessonType}) to ${studentEmail}`);
            return db.collection('access').doc(`${studentEmail}-${lessonId}`).set({
                studentEmail: studentEmail,
                lessonId: lessonId,
                grantedBy: currentUser ? currentUser.email : 'admin',
                grantedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert('Lesson assigned successfully!');
            document.getElementById('student-email').value = '';
            document.getElementById('video-url').value = '';
            document.getElementById('month').selectedIndex = 0;
            document.getElementById('year').value = '';
            document.getElementById('lesson-type').selectedIndex = 0;
            document.getElementById('lesson-description').value = '';
            
            // Refresh student list
            loadStudents();
        })
        .catch((error) => {
            console.error('Error assigning lesson:', error);
            alert('Error assigning lesson: ' + error.message);
            sendLogToDiscord(`Error assigning lesson: ${error.message}`);
        });
}

function loadLessons(email) {
    lessonsContainer.innerHTML = '<p>Loading your lessons...</p>';
    
    // Get all lessons the user has access to
    db.collection('access')
        .where('studentEmail', '==', email)
        .get()
        .then(accessSnapshot => {
            if (accessSnapshot.empty) {
                lessonsContainer.innerHTML = '<p>You don\'t have access to any lessons yet.</p>';
                return;
            }
            
            const lessonIds = accessSnapshot.docs.map(doc => doc.data().lessonId);
            let loadedLessons = 0;
            lessonsContainer.innerHTML = '';
            
            // Load each lesson
            lessonIds.forEach(lessonId => {
                db.collection('lessons').doc(lessonId).get()
                    .then(lessonDoc => {
                        if (lessonDoc.exists) {
                            const lessonData = lessonDoc.data();
                            createLessonCard(lessonData, lessonId);
                        }
                        
                        loadedLessons++;
                        if (loadedLessons === lessonIds.length && lessonsContainer.innerHTML === '') {
                            lessonsContainer.innerHTML = '<p>No lessons found. Please contact support.</p>';
                        }
                    })
                    .catch(error => {
                        console.error('Error loading lesson:', error);
                        loadedLessons++;
                        if (loadedLessons === lessonIds.length && lessonsContainer.innerHTML === '') {
                            lessonsContainer.innerHTML = '<p>Error loading lessons. Please try again later.</p>';
                        }
                    });
            });
        })
        .catch(error => {
            console.error('Error loading access:', error);
            lessonsContainer.innerHTML = '<p>Error loading lessons. Please try again later.</p>';
        });
}

function createLessonCard(lessonData, lessonId) {
    const monthName = capitalizeFirstLetter(lessonData.month);
    const lessonType = capitalizeFirstLetter(lessonData.type);
    
    // Use custom description if available, otherwise use default
    const description = lessonData.description || 
        "පාඩම අතරතුරදීම රාත්‍රී 7 සිට 9 දක්වා Zoom මගින්ද සම්බන්ධ වෙන්න. සෑම විනාඩි හෝ මිනිත්තු හැරෙන විනාඩි නැවතීම හැකිය. වැඩිදුර තොරතුරු දැනගැනීම සඳහා Telegram සමූහයට පිවිසෙන්න.";
    
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.innerHTML = `
        <div class="lesson-header">
            <h3>${monthName} Month Lesson (${lessonType})</h3>
        </div>
        <div class="lesson-content">
            <div class="video-container">
                <iframe src="${getEmbedUrl(lessonData.videoUrl)}" allowfullscreen></iframe>
            </div>
            <div class="lesson-description">
                ${description}
            </div>
        </div>
        <div class="lesson-footer">
            <button class="visit-btn">Visit</button>
        </div>
    `;
    
    // Add event listener for the visit button
    card.querySelector('.visit-btn').addEventListener('click', () => {
        sendLogToDiscord(`Student accessed lesson: ${monthName} ${lessonData.year} (${lessonType})`);
        window.open(lessonData.videoUrl, '_blank');
    });
    
    lessonsContainer.appendChild(card);
}

function loadStudents() {
    studentsContainer.innerHTML = '<p>Loading students...</p>';
    
    // Get all unique students with access
    db.collection('access')
        .get()
        .then(accessSnapshot => {
            if (accessSnapshot.empty) {
                studentsContainer.innerHTML = '<p>No students found.</p>';
                return;
            }
            
            const studentMap = new Map();
            
            // Group lessons by student
            accessSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!studentMap.has(data.studentEmail)) {
                    studentMap.set(data.studentEmail, []);
                }
                studentMap.get(data.studentEmail).push(data.lessonId);
            });
            
            // Display students
            studentsContainer.innerHTML = '';
            studentMap.forEach((lessons, email) => {
                const studentItem = document.createElement('div');
                studentItem.className = 'student-item';
                studentItem.innerHTML = `
                    <div class="student-email">${email}</div>
                    <div class="student-lessons">Lessons: ${lessons.length}</div>
                `;
                studentsContainer.appendChild(studentItem);
            });
        })
        .catch(error => {
            console.error('Error loading students:', error);
            studentsContainer.innerHTML = '<p>Error loading students. Please try again later.</p>';
        });
}

// Custom Lesson Type Functions
function showCustomTypeInput() {
    document.getElementById('custom-type-group').style.display = 'block';
}

function saveCustomType() {
    const customType = document.getElementById('custom-lesson-type').value.trim();
    if (customType) {
        const lessonTypeSelect = document.getElementById('lesson-type');
        const option = document.createElement('option');
        option.value = customType.toLowerCase().replace(/\s+/g, '-');
        option.textContent = customType;
        lessonTypeSelect.appendChild(option);
        lessonTypeSelect.value = option.value;
        
        // Save custom type to Firestore for future use
        db.collection('lesson_types').doc(option.value).set({
            name: customType,
            createdBy: currentUser ? currentUser.email : 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            sendLogToDiscord(`New lesson type created: ${customType}`);
            document.getElementById('custom-type-group').style.display = 'none';
            document.getElementById('custom-lesson-type').value = '';
        })
        .catch(error => {
            console.error('Error saving custom type:', error);
        });
    }
}

// Discord Webhook Integration
function sendLogToDiscord(message) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.log('Discord webhook not configured:', message);
        return;
    }
    
    const payload = {
        content: message,
        username: 'CM with MN Learning Platform'
    };
    
    fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .catch(error => {
        console.error('Error sending log to Discord:', error);
    });
}

// Helper Functions
function showLoginPage() {
    loginContainer.style.display = 'flex';
    adminLoginContainer.style.display = 'none';
    studentDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
    
    sendLogToDiscord('User logged out or viewing login page');
}

function showAdminLoginPage() {
    loginContainer.style.display = 'none';
    adminLoginContainer.style.display = 'flex';
    studentDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
}

function showStudentDashboard() {
    loginContainer.style.display = 'none';
    adminLoginContainer.style.display = 'none';
    studentDashboard.style.display = 'block';
    adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    loginContainer.style.display = 'none';
    adminLoginContainer.style.display = 'none';
    studentDashboard.style.display = 'none';
    adminDashboard.style.display = 'block';
}

function getEmbedUrl(url) {
    // Convert YouTube URL to embed URL
    if (url.includes('youtube.com/watch')) {
        return url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
        return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}