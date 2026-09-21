export type ConsentRecord = {
  documentVersion: string;
  /** ISO-8601 timestamp */
  acceptedAt: string;
};

export type ConsentAcceptedPayload = ConsentRecord;
