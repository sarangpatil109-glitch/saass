import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendActivationEmail(
  customerEmail: string, 
  customerName: string, 
  gymName: string, 
  softwareLink: string = 'https://procerix.store/login', 
  installationGuide: string = 'https://procerix.store/guide'
) {
  try {
    const supabase = await createClient();

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <div style="background-color: #2563EB; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">GymOS Software Activated</h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; margin-top: 0;">Hi ${customerName},</p>
            <p style="font-size: 16px;">Congratulations! 🎉</p>
            <p style="font-size: 16px;">Your GymOS Software has been successfully activated and is now ready to use.</p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

            <!-- Details -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0;"><strong>🏋️ Business Name:</strong><br/>${gymName}</p>
              <p style="margin: 0;"><strong>✅ Status:</strong><br/><span style="color: #16a34a; font-weight: 600;">Active</span></p>
            </div>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

            <!-- Software Files -->
            <h2 style="font-size: 18px; font-weight: 600; margin-top: 0;">🌐 Software Files</h2>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://drive.google.com/drive/folders/19v9Z714SRVvwp7W4GCbGeDUBNqedgD9r?usp=sharing" style="display: inline-block; background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Download Software</a>
            </div>
            <p style="font-size: 14px; color: #4b5563; word-break: break-all; text-align: center; margin-bottom: 32px;">
              <a href="https://drive.google.com/drive/folders/19v9Z714SRVvwp7W4GCbGeDUBNqedgD9r?usp=sharing" style="color: #2563EB; text-decoration: underline;">https://drive.google.com/drive/folders/19v9Z714SRVvwp7W4GCbGeDUBNqedgD9r?usp=sharing</a>
            </p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

            <!-- Installation Guide -->
            <h2 style="font-size: 18px; font-weight: 600; margin-top: 0;">📹 Installation Guide</h2>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://youtu.be/hfx1jd5YUtc?si=RPeYa2JZq28ExeM9" style="display: inline-block; background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Watch Installation Guide</a>
            </div>
            <p style="font-size: 14px; color: #4b5563; word-break: break-all; text-align: center; margin-bottom: 32px;">
              <a href="https://youtu.be/hfx1jd5YUtc?si=RPeYa2JZq28ExeM9" style="color: #2563EB; text-decoration: underline;">https://youtu.be/hfx1jd5YUtc?si=RPeYa2JZq28ExeM9</a>
            </p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

            <!-- User Manual -->
            <h2 style="font-size: 18px; font-weight: 600; margin-top: 0;">📄 User Manual (PDF)</h2>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://drive.google.com/file/d/1BriT2g9hreof-K0FWTVJcoCPFA0iXlpe/view?usp=sharing" style="display: inline-block; background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Open User Manual</a>
            </div>
            <p style="font-size: 14px; color: #4b5563; word-break: break-all; text-align: center; margin-bottom: 32px;">
              <a href="https://drive.google.com/file/d/1BriT2g9hreof-K0FWTVJcoCPFA0iXlpe/view?usp=sharing" style="color: #2563EB; text-decoration: underline;">https://drive.google.com/file/d/1BriT2g9hreof-K0FWTVJcoCPFA0iXlpe/view?usp=sharing</a>
            </p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

            <!-- Support -->
            <h2 style="font-size: 18px; font-weight: 600; margin-top: 0;">Need Help?</h2>
            <p style="font-size: 16px; margin-bottom: 16px; text-align: center;">📞 WhatsApp Support</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://wa.me/917559368068" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Chat on WhatsApp</a>
            </div>
            <p style="font-size: 14px; color: #4b5563; word-break: break-all; text-align: center; margin-bottom: 16px;">
              <a href="https://wa.me/917559368068" style="color: #25D366; text-decoration: underline;">https://wa.me/917559368068</a>
            </p>
            <p style="font-size: 14px; color: #4b5563; text-align: center; font-style: italic;">
              "We usually reply within a few minutes during business hours."
            </p>

          </div>
          
          <!-- Footer -->
          <div style="background-color: #f3f4f6; padding: 32px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">Best Regards,</p>
            <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px; color: #111827;">GymOS Team</p>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563;">Procerix Technologies</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;">
              <a href="https://procerix.store" style="color: #2563EB; text-decoration: none;">https://procerix.store</a>
            </p>
            <p style="margin: 0 0 24px 0; font-size: 14px;">
              <a href="mailto:support@procerix.store" style="color: #2563EB; text-decoration: none;">support@procerix.store</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Copyright © 2026 Procerix Technologies</p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'GymOS <noreply@procerix.store>',
      to: [customerEmail],
      replyTo: 'patilbhika0@gmail.com',
      subject: '🎉 Your GymOS Software Has Been Activated',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend Error:', error);
      // Log failure
      await supabase.from('email_logs').insert({
        customer_email: customerEmail,
        customer_name: customerName,
        subject: '🎉 Your GymOS Software Has Been Activated',
        status: 'failed',
        error_message: error.message
      });
      return { success: false, error: error.message };
    }

    // Log success
    await supabase.from('email_logs').insert({
      customer_email: customerEmail,
      customer_name: customerName,
      subject: '🎉 Your GymOS Software Has Been Activated',
      status: 'sent'
    });

    return { success: true, data };
  } catch (err: any) {
    console.error('Failed to send activation email:', err);
    // Never throw from here, so it doesn't break the approval flow
    return { success: false, error: err.message };
  }
}
