import nodemailer from 'nodemailer';

// Email transporter
let transporter: nodemailer.Transporter | null = null;

// Interface for email message data
export interface EmailMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Initialize the email service
 * Uses Ethereal for testing in development environment
 * Will use SendGrid or another provider in production
 */
export async function initializeEmailService() {
  if (transporter) {
    return true; // Already initialized
  }
  
  try {
    // Check if we have SendGrid API key
    if (process.env.SENDGRID_API_KEY) {
      console.log('Initializing email service with SendGrid');
      // Initialize SendGrid transporter
      transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
      
      return true;
    }
    
    // For development/testing - use Ethereal
    console.log('Setting up Ethereal test account for email service');
    
    // Create test account at Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    // Create reusable transporter
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('Email service initialized with Ethereal test account');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    return false;
  }
}

/**
 * Send an email
 * @param messageData Message data including name, email, subject, and message
 * @returns Success status and optional error message
 */
export async function sendEmail(messageData: EmailMessage) {
  // Ensure transporter is initialized
  if (!transporter) {
    await initializeEmailService();
  }
  
  try {
    // Setup email data
    const mailOptions = {
      from: `"${messageData.name}" <${messageData.email}>`,
      to: 'contact@grindinglunacy.com', // Destination email
      subject: `[MediaGrab Contact] ${messageData.subject}`, 
      text: messageData.message,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${messageData.name} (${messageData.email})</p>
        <p><strong>Subject:</strong> ${messageData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${messageData.message.replace(/\n/g, '<br>')}</p>
      `
    };
    
    // Send the email
    const info = await transporter!.sendMail(mailOptions);
    
    console.log(`Message sent: ${info.messageId}`);
    
    // Preview URL (only available when using Ethereal for testing)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      success: false,
      error: error
    };
  }
}