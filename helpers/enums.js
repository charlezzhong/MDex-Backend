
const statusValue = Object.freeze({ 
    'approved': 'approved', 
    'pending': 'pending', 
    'rejected': 'rejected', 
});

const eligible = Object.freeze({ 
    'yes': true, 
    'no': false
});

const country = Object.freeze({ 
    'US': 'United States', 
    'CA': 'Canada', 
    'UK': 'United Kingdom', 
    'PK': 'Pakistan', 
});

const rsvpStatus = Object.freeze({ 
    'open': 'open', 
    'full': 'full', 
    'waitlist': 'waitlist', 
});

module.exports = { statusValue, eligible, country, rsvpStatus };