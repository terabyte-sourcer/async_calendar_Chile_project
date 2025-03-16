// User Roles
export const UserRole = {
    USER: 'user',
    SUPER_ADMIN: 'super_admin',
};

// Meeting Types
export const MeetingType = {
    VIRTUAL: 'virtual',
    IN_PERSON: 'in_person',
};

// Route Time Duration
export const RouteTimeDuration = {
    THIRTY_MINUTES: 30,
    FORTY_FIVE_MINUTES: 45,
    SIXTY_MINUTES: 60,
};

// Calendar Providers
export const CalendarProvider = {
    GOOGLE: 'google',
    OUTLOOK: 'outlook',
    APPLE: 'apple',
    MAILCOW: 'mailcow',
};

// Virtual Meeting Providers
export const VirtualMeetingProvider = {
    ZOOM: 'zoom',
    GOOGLE_MEET: 'google_meet',
    MICROSOFT_TEAMS: 'microsoft_teams',
    CUSTOM: 'custom',
};

// Days of Week
export const DaysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
];

// Time Slots (for availability)
export const TimeSlots = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const hourFormatted = hour.toString().padStart(2, '0');
    const minuteFormatted = minute.toString().padStart(2, '0');
    return {
        value: `${hourFormatted}:${minuteFormatted}`,
        label: `${hour % 12 || 12}:${minuteFormatted} ${hour < 12 ? 'AM' : 'PM'}`,
    };
}); 