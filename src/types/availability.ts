/**
 * Response shapes from ProfessionalAvailabilityController (routes/api.php).
 * Fields match the Laravel controller — do not invent extras.
 */

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type AvailabilityTimeRange = {
  start_time: string;
  end_time: string;
};

export type AvailabilityMonthSuccessData = {
  professional: {
    id: number;
    /** Controller concatenates first_name + last_name (may be sparse). */
    name: string;
  };
  availability: {
    id: number;
    month: string;
    session_duration: number;
    weekly_slots: Partial<Record<string, AvailabilityTimeRange[]>>;
  };
};

/** When no month record exists: success false, data null. */
export type AvailabilityMonthResponse =
  | {
      success: true;
      data: AvailabilityMonthSuccessData;
    }
  | {
      success: false;
      message: string;
      data: null;
    };

/** Available calendar dates for a month (YYYY-MM-DD strings). */
export type AvailableDatesResponse = {
  success: true;
  data: string[];
};

export type AvailableSlot = {
  start_time: string;
  end_time: string;
  duration: number;
};

export type AvailableSlotsData = {
  date: string;
  weekday: string;
  session_duration: number;
  slots: AvailableSlot[];
};

export type AvailableSlotsResponse = {
  success: true;
  data: AvailableSlotsData;
};
