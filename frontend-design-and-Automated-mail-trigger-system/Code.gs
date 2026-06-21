/* ============================================
   AI Learning Portal — Google Apps Script
   Code.gs — Sheet Backend + Premium Email
   ============================================

   SETUP INSTRUCTIONS:
   ───────────────────
   1. Paste this file into your Apps Script project (replace old Code.gs).
   2. Update SHEET_ID below with your Google Sheet ID.
   3. Run  ▶ installTrigger()  ONCE to set up automatic email on manual edits.
   4. Re-deploy: Deploy → Manage Deployments → Edit → New Version → Deploy.

   HOW EMAILS WORK:
   ────────────────
   • Web form submissions (doPost) → email is sent automatically.
   • Manual row additions in Sheet → email is sent via the installable trigger.
   ============================================ */

// ===== CONFIGURATION =====
const SHEET_ID   = '1cpgkxLYtjedd8oFl8FHsVkbs0bNKI2KWdiALtXuoZ80';
const SHEET_NAME = 'Registrations';

// ──────────────────────────────────────────────
//  1. WEB APP ENDPOINTS
// ──────────────────────────────────────────────

/**
 * doPost — Receives form data from the frontend, saves to Sheet, sends email.
 */
function doPost(e) {
  try {
    var data;

    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return buildResponse({ status: 'error', message: 'No data received.' });
    }

    var result = appendToSheet(data);
    return buildResponse(result);

  } catch (err) {
    return buildResponse({ status: 'error', message: 'Server error: ' + err.message });
  }
}

/**
 * doGet — Health check / fallback data receiver.
 */
function doGet(e) {
  if (e.parameter && e.parameter.fullName) {
    try {
      var result = appendToSheet(e.parameter);
      return buildResponse(result);
    } catch (err) {
      return buildResponse({ status: 'error', message: 'Server error: ' + err.message });
    }
  }
  return buildResponse({ status: 'ok', message: 'AI Learning Portal API is running.' });
}

/**
 * buildResponse — JSON output helper.
 */
function buildResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────
//  2. SHEET OPERATIONS
// ──────────────────────────────────────────────

/**
 * appendToSheet — Appends a registration row to the Google Sheet.
 */
function appendToSheet(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  }

  var timestamp = Utilities.formatDate(
    new Date(), 'Asia/Kolkata', 'dd-MM-yyyy HH:mm:ss'
  );

  sheet.appendRow([
    timestamp,
    data.fullName       || '',
    data.department      || '',
    data.year            || '',
    data.collegeName     || '',
    data.registerNumber  || '',
    data.email           || '',
    data.mobile          || '',
    data.course          || ''
  ]);

  // ✉️ Automatically send welcome email after saving to Sheet
  try {
    sendWelcomeEmail(data);
    Logger.log('✅ Data saved + email sent to: ' + data.email);
  } catch (mailErr) {
    Logger.log('⚠️ Data saved but email failed: ' + mailErr.message);
  }

  return {
    status:    'success',
    message:   'Registration Saved',
    timestamp: timestamp
  };
}

// ──────────────────────────────────────────────
//  3. INSTALLABLE TRIGGER (for manual Sheet edits)
// ──────────────────────────────────────────────

/**
 * installTrigger — Run this ONCE to set up the onChange trigger.
 * Go to ▶ Run → installTrigger
 */
function installTrigger() {
  // Remove any existing triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });

  // Create a new onChange trigger
  ScriptApp.newTrigger('onSheetChange')
    .forSpreadsheet(SHEET_ID)
    .onChange()
    .create();

  Logger.log('✅ Trigger installed successfully.');
}

/**
 * onSheetChange — Fires when the Sheet changes (row inserted, etc.).
 * Checks the last row and sends an email if it hasn't been sent already.
 */
function onSheetChange(e) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return;

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return; // Only header row

    var row = sheet.getRange(lastRow, 1, 1, 9).getValues()[0];

    // Column mapping: 0=Timestamp, 1=FullName, 2=Dept, 3=Year,
    //   4=College, 5=RegNo, 6=Email, 7=Mobile, 8=Course

    var email = row[6];
    if (!email || email.toString().indexOf('@') === -1) return;

    var data = {
      fullName:       row[1],
      department:     row[2],
      year:           row[3],
      collegeName:    row[4],
      registerNumber: row[5],
      email:          row[6],
      mobile:         row[7],
      course:         row[8]
    };

    sendWelcomeEmail(data);

  } catch (err) {
    Logger.log('onSheetChange error: ' + err.message);
  }
}

// ──────────────────────────────────────────────
//  4. PREMIUM HTML EMAIL
// ──────────────────────────────────────────────

/**
 * sendWelcomeEmail — Sends a premium HTML confirmation email.
 */
function sendWelcomeEmail(data) {
  var recipientEmail = data.email;
  if (!recipientEmail || recipientEmail.indexOf('@') === -1) {
    Logger.log('Invalid email, skipping: ' + recipientEmail);
    return;
  }

  var studentName   = data.fullName       || 'Student';
  var department    = data.department      || '—';
  var year          = data.year            || '—';
  var collegeName   = data.collegeName     || '—';
  var registerNo    = data.registerNumber  || '—';
  var course        = data.course          || '—';

  var subject = 'Course Registration Details: ' + course;

  var htmlBody = buildEmailHTML(studentName, department, year, collegeName, registerNo, course);

  var plainBody = 'Hello ' + studentName + ',\n\n' +
    'This email confirms your recent course registration.\n\n' +
    'Registration Details:\n' +
    'Name: ' + studentName + '\n' +
    'Department: ' + department + '\n' +
    'Year: ' + year + '\n' +
    'College: ' + collegeName + '\n' +
    'Register Number: ' + registerNo + '\n' +
    'Selected Course: ' + course + '\n\n' +
    'Access the learning portal here: https://grow.google/ai\n\n' +
    'Best Regards,\nOrganizing Team';

  // Include a replyTo address to help pass spam filters
  var senderEmail = Session.getActiveUser().getEmail();

  GmailApp.sendEmail(recipientEmail, subject, plainBody, {
    htmlBody: htmlBody,
    name: 'AI Learning Portal',
    replyTo: senderEmail !== '' ? senderEmail : undefined
  });

  Logger.log('✅ Email sent to: ' + recipientEmail);
}

function buildEmailHTML(name, dept, year, college, regNo, course) {
  // A clean, standard transactional email template to prevent spam flagging
  return '<!DOCTYPE html>' +
  '<html>' +
  '<head><meta charset="UTF-8"></head>' +
  '<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">' +
  '<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e4e4e7; overflow: hidden;">' +
  '<tr><td style="background-color: #2563eb; padding: 30px; text-align: center;">' +
  '<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">AI Learning Portal</h1>' +
  '</td></tr>' +
  '<tr><td style="padding: 40px 30px;">' +
  '<h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Hello ' + name + ',</h2>' +
  '<p style="color: #4b5563; font-size: 16px; line-height: 1.5;">This email confirms your registration for <strong>' + course + '</strong>.</p>' +
  '<table width="100%" cellpadding="14" cellspacing="0" style="margin-top: 30px; margin-bottom: 30px; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px;">' +
  '<tr><td style="border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%; font-size: 14px;">Name</td><td style="border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold; font-size: 15px;">' + name + '</td></tr>' +
  '<tr><td style="border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Department</td><td style="border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold; font-size: 15px;">' + dept + '</td></tr>' +
  '<tr><td style="border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Year</td><td style="border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold; font-size: 15px;">' + year + '</td></tr>' +
  '<tr><td style="border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">College</td><td style="border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold; font-size: 15px;">' + college + '</td></tr>' +
  '<tr><td style="border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Register Number</td><td style="border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold; font-size: 15px;">' + regNo + '</td></tr>' +
  '<tr><td style="color: #6b7280; font-size: 14px;">Course</td><td style="color: #2563eb; font-weight: bold; font-size: 15px;">' + course + '</td></tr>' +
  '</table>' +
  '<p style="color: #4b5563; font-size: 16px; margin-bottom: 25px;">Access the learning portal using the link below:</p>' +
  '<a href="https://grow.google/ai" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 15px;">Access Learning Portal</a>' +
  '</td></tr>' +
  '<tr><td style="background-color: #f9fafb; border-top: 1px solid #e4e4e7; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">' +
  '<p style="margin: 0 0 10px 0;">This email was sent to you because you registered for the AI Learning Portal.</p>' +
  '<p style="margin: 0;">&copy; ' + new Date().getFullYear() + ' Organizing Team. Please do not reply to this automated message.</p>' +
  '</td></tr>' +
  '</table>' +
  '</body></html>';
}

// ──────────────────────────────────────────────
//  5. TEST FUNCTIONS
// ──────────────────────────────────────────────

/**
 * testAppend — Manually test appending a row to the Sheet.
 */
function testAppend() {
  var testData = {
    fullName:       'Test Student',
    department:     'CSE',
    year:           '2nd Year',
    collegeName:    'Test College',
    registerNumber: '2024CSE001',
    email:          'test@college.edu',
    mobile:         '9876543210',
    course:         'Artificial Intelligence'
  };
  var result = appendToSheet(testData);
  Logger.log(result);
}

/**
 * testEmail — Manually test sending the welcome email.
 * ⚠️ Replace the email below with YOUR email to receive the test.
 */
function testEmail() {
  var testData = {
    fullName:       'Priya Sharma',
    department:     'AI & DS',
    year:           '3rd Year',
    collegeName:    'ABC Institute of Technology',
    registerNumber: '2024AIDS042',
    email:          'YOUR_EMAIL_HERE',   // <-- Replace with your email
    mobile:         '9876543210',
    course:         'Machine Learning'
  };
  sendWelcomeEmail(testData);
  Logger.log('✅ Test email sent!');
}
