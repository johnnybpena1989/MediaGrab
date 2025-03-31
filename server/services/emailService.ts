import { MailService } from '@sendgrid/mail';

// Initialize the mail service
const mailService = new MailService();

// We'll check for the API key at runtime
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string; // This should be a verified sender in SendGrid
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email notification
 * @param params Email parameters including to, from, subject, and content
 * @returns Promise resolving to true if email sent successfully, false otherwise
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Check if SendGrid API key is available
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY is not set. Email notifications are disabled.');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send a download completion notification
 * @param to Recipient email
 * @param fileName Name of the downloaded file
 * @param fileSize Size of the downloaded file
 * @param downloadUrl URL to access the downloaded file (if applicable)
 * @returns Promise resolving to true if email sent successfully, false otherwise
 */
export async function sendDownloadCompleteNotification(
  to: string,
  fileName: string,
  fileSize: string,
  downloadUrl?: string
): Promise<boolean> {
  // Default sender email - should be configured in SendGrid
  const fromEmail: string = process.env.NOTIFICATION_EMAIL ?? 'notifications@mediadownloader.app';
  
  const subject = 'Your Download is Complete';
  
  const text = `Your download is complete!
  
File: ${fileName}
Size: ${fileSize}
${downloadUrl ? `Download URL: ${downloadUrl}` : ''}

Thank you for using Media Downloader.`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
    <h2 style="color: #4a5568; margin-bottom: 20px;">Your Download is Complete!</h2>
    
    <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <p style="margin: 5px 0;"><strong>File:</strong> ${fileName}</p>
      <p style="margin: 5px 0;"><strong>Size:</strong> ${fileSize}</p>
      ${downloadUrl ? `<p style="margin: 15px 0;"><a href="${downloadUrl}" style="display: inline-block; background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Download File</a></p>` : ''}
    </div>
    
    <p style="color: #718096; font-size: 14px;">Thank you for using Media Downloader.</p>
  </div>
  `;

  return sendEmail({
    to,
    from: fromEmail,
    subject,
    text,
    html
  });
}