const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

type TwilioIncomingPhoneNumber = {
  phone_number?: string;
  capabilities?: {
    SMS?: boolean;
    sms?: boolean;
  };
};

type TwilioMessage = {
  sid?: string;
  status?: string;
};

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumberSid = process.env.TWILIO_PHONE_NUMBER_SID;

  if (!accountSid || !authToken || !phoneNumberSid) {
    throw new Error("Missing Twilio environment variables.");
  }

  return { accountSid, authToken, phoneNumberSid };
}

function getTwilioAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function normalizeSmsNumber(rawNumber: string) {
  const trimmed = rawNumber.trim();

  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(/[^\d]/g, "");
    return digits ? `+${digits}` : "";
  }

  const digits = trimmed.replace(/[^\d]/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return digits ? `+${digits}` : "";
}

async function readTwilioError(response: Response) {
  const fallback = `Twilio request failed with status ${response.status}.`;

  try {
    const data = (await response.json()) as { message?: string };
    return data.message ? `Twilio request failed: ${data.message}` : fallback;
  } catch {
    return fallback;
  }
}

async function getSenderPhoneNumber() {
  const { accountSid, authToken, phoneNumberSid } = getTwilioConfig();
  const response = await fetch(
    `${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
    {
      headers: {
        Authorization: getTwilioAuthHeader(accountSid, authToken),
      },
    },
  );

  if (!response.ok) {
    throw new Error(await readTwilioError(response));
  }

  const phoneNumber = (await response.json()) as TwilioIncomingPhoneNumber;
  const smsCapable = phoneNumber.capabilities?.SMS ?? phoneNumber.capabilities?.sms;

  if (smsCapable === false) {
    throw new Error("Configured Twilio number is not SMS-capable.");
  }

  if (!phoneNumber.phone_number) {
    throw new Error("Configured Twilio number does not include a sender phone number.");
  }

  return phoneNumber.phone_number;
}

export async function sendSmsNotification(to: string, body: string) {
  const { accountSid, authToken } = getTwilioConfig();
  const from = await getSenderPhoneNumber();
  const normalizedTo = normalizeSmsNumber(to);

  if (!normalizedTo) {
    throw new Error("Notification number is not valid.");
  }

  const payload = new URLSearchParams({
    Body: body,
    From: from,
    To: normalizedTo,
  });

  const response = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    body: payload,
    headers: {
      Authorization: getTwilioAuthHeader(accountSid, authToken),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readTwilioError(response));
  }

  const message = (await response.json()) as TwilioMessage;
  return {
    sid: message.sid ?? "",
    status: message.status ?? "queued",
  };
}
