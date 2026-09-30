Barangay Management Information System (BMIS)
Barangay San Jose Annex Area 6, Rodriguez, Rizal

HOW TO RUN
1. Open the folder in VS Code.
2. Install the "Live Server" extension, right-click index.html -> "Open with Live Server".
   (You can also just double-click index.html.)

FILES
index.html      - page structure
css/style.css   - all styles (white/orange theme, red for emergency)
js/script.js    - all logic (login, sign up, complaints, daily operations,
                  emergency rescue, announcements, about us, language switch)
images/         - logo.png, background.jpg

DEFAULT ACCOUNTS (change the passwords!)
Head Admin: headadmin / admin123
Admin:      admin / admin123

NOTE
This is a front-end prototype. Data is saved in the browser (localStorage) only.
For real use, connect a backend + database (e.g. PHP + MySQL, Node.js + MongoDB, or Firebase),
hash passwords, and store ID photos in protected storage.
