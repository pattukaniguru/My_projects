# 🎓 AI Learning Portal - Student Registration

A modern, responsive, and beautifully designed student registration portal. Built with pure HTML, CSS, and Vanilla JavaScript on the frontend, and powered by Google Apps Script and Google Sheets on the backend.

## ✨ Features

- **Modern UI/UX**: Stunning glassmorphism card design with deep, professional color palettes.
- **Theme Support**: Built-in Dark Mode and Light Mode toggle button for user accessibility.
- **Fully Responsive**: Seamlessly adapts to mobile, tablet, and desktop screens.
- **Serverless Backend**: Uses Google Sheets as a database via Google Apps Script (No traditional server required!).
- **Automated Email Receipts**: Automatically sends a highly-deliverable, clean HTML transactional email to the student upon successful registration.
- **No-CORS Fetching**: Built to handle cross-origin restrictions gracefully when interacting with Google Web Apps.
- **Success Confetti Animations**: Beautiful visual feedback when a user completes their registration.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla, CSS Variables), Vanilla JavaScript.
- **Backend/Database**: Google Sheets.
- **Serverless API / Emailer**: Google Apps Script (`Code.gs`).

## 🚀 Setup & Installation

### 1. Google Sheets Backend Setup
1. Create a new [Google Sheet](https://sheets.google.com).
2. Rename the first tab to **Registrations**.
3. Create the following headers in Row 1 (A to I):
   `Timestamp | Full Name | Department | Year | College Name | Register Number | Email ID | Mobile Number | Selected Course`
4. Go to **Extensions** > **Apps Script**.
5. Delete any existing code and paste the contents of `Code.gs` from this repository.
6. Replace the `SHEET_ID` variable in the script with your actual Google Sheet ID (found in your URL).
7. Click **Deploy** > **New Deployment**:
   - **Type**: Web App
   - **Execute as**: Me
   - **Who has access**: Anyone
8. Copy the generated **Web App URL**.

### 2. Frontend Setup
1. Open `script.js`.
2. Locate the `scriptURL` variable at the top of the file:
   ```javascript
   const scriptURL = 'YOUR_WEB_APP_URL_HERE';
   ```
3. Replace the placeholder with the Web App URL you copied from Google Apps Script.
4. Open `index.html` in your browser to run the application locally!

## ✉️ Automated Emails
The system uses `GmailApp` within the Google Apps Script to automatically send a confirmation email. It is configured to:
- Use a clean, transactional HTML layout to guarantee high inbox deliverability and prevent spam flags.
- Fallback to plain-text formatting for strict email clients.
- Authenticate through the deployer's Google account automatically.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
