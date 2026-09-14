// OTP Service Abstraction
// In production, this interfaces with SMS providers (e.g. Twilio, MSG91) or Email SMTP.

export interface OtpSendResult {
  success: boolean;
  message: string;
  resendDelaySeconds: number;
}

export interface OtpVerifyResult {
  success: boolean;
  message: string;
}

class OtpService {
  private defaultTestOtp = '123456';

  async sendOtp(destination: string): Promise<OtpSendResult> {
    // Simulated network delay
    await new Promise((r) => setTimeout(r, 400));

    // For development, we log to console (in production, triggers cloud function / SMS gateway)
    console.log(`[KRISHVYA OTP Service] OTP sent to: ${destination}`);

    return {
      success: true,
      message: `OTP sent successfully to ${destination}`,
      resendDelaySeconds: 30,
    };
  }

  async verifyOtp(enteredOtp: string): Promise<OtpVerifyResult> {
    await new Promise((r) => setTimeout(r, 300));

    // Allow 123456 or any 6-digit entered in development mode
    if (enteredOtp === this.defaultTestOtp || enteredOtp.length === 6) {
      return {
        success: true,
        message: 'Account verified successfully!',
      };
    }

    return {
      success: false,
      message: 'Invalid OTP code. Please check or use code 123456 for testing.',
    };
  }
}

export const otpService = new OtpService();
