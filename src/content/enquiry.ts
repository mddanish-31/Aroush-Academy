export interface EnquiryPayload {
  studentName: string;
  contactNumber: string;
  targetClass: string;
  targetBoard: string;
  notes?: string;
  honeypot?: string;
}

export interface EnquiryResult {
  success: boolean;
  message: string;
  fallbackNeeded?: boolean;
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<EnquiryResult> {
  if (payload.honeypot && payload.honeypot.trim() !== "") {
    return {
      success: false,
      message: "Submission could not be processed.",
    };
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    return {
      success: false,
      fallbackNeeded: true,
      message: "Online inquiry submission is currently offline. Please contact our admissions desk directly by phone at 098830 05641 or 82408 16226, or email aroushacademyazharsir@gmail.com.",
    };
  }

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/enquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return {
      success: true,
      message: "Thank you. Your inquiry has been submitted successfully to our admissions desk.",
    };
  } catch {
    return {
      success: false,
      fallbackNeeded: true,
      message: "Unable to connect to the admissions server. Please call us directly at 098830 05641 or 82408 16226, or email aroushacademyazharsir@gmail.com.",
    };
  }
}
