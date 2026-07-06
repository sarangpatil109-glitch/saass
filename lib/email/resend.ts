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
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${customerName},</p>
        <p>Congratulations!</p>
        <p>Your GymOS Software has been successfully activated and is now ready to use.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>
          <strong>Business Name:</strong><br/>
          ${gymName}
        </p>
        <p>
          <strong>Status:</strong><br/>
          Active
        </p>
        <p>
          <strong>Software Login:</strong><br/>
          <a href="${softwareLink}" style="color: #0056b3;">${softwareLink}</a>
        </p>
        <p>
          <strong>Installation Guide:</strong><br/>
          <a href="${installationGuide}" style="color: #0056b3;">${installationGuide}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Need Help?</strong></p>
        <p>
          WhatsApp Support<br/>
          <a href="https://wa.me/917559368068" style="color: #25D366; font-weight: bold;">https://wa.me/917559368068</a>
        </p>
        <p>We usually reply within a few minutes during business hours.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>Thank you for choosing GymOS.</p>
        <p>
          Best Regards,<br/>
          GymOS Team<br/>
          Procerix Technologies<br/>
          <a href="https://procerix.store" style="color: #0056b3;">https://procerix.store</a>
        </p>
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
