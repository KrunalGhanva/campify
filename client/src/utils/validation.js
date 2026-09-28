const required = (value) => !String(value ?? '').trim();

export const validateCampground = (values) => {
    const errors = {};
    if (required(values.title)) errors.title = 'Enter a campground title.';
    else if (values.title.trim().length > 100) errors.title = 'Title must be 100 characters or fewer.';

    if (required(values.location)) errors.location = 'Enter a location.';
    else if (values.location.trim().length > 200) errors.location = 'Location must be 200 characters or fewer.';

    const price = Number(values.price);
    if (required(values.price)) errors.price = 'Enter a nightly price.';
    else if (!Number.isFinite(price) || price < 0) errors.price = 'Price must be a number that is zero or more.';

    if (required(values.description)) errors.description = 'Enter a description.';
    else if (values.description.trim().length > 2000) errors.description = 'Description must be 2,000 characters or fewer.';
    return errors;
};

export const validateReview = ({ rating, body }) => {
    const errors = {};
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choose a rating from 1 to 5.';
    if (required(body)) errors.body = 'Write a review before submitting.';
    else if (body.trim().length > 1000) errors.body = 'Review must be 1,000 characters or fewer.';
    return errors;
};

export const validateLogin = ({ loginIdentifier, password }) => {
    const errors = {};
    if (required(loginIdentifier)) errors.loginIdentifier = 'Enter your username, email, or mobile.';
    if (required(password)) errors.password = 'Enter your password.';
    return errors;
};

export const validateRegistration = ({ email, mobile, username, password }) => {
    const errors = {};
    if (required(username)) errors.username = 'Enter your username.';
    if (required(password)) errors.password = 'Enter your password.';
    
    if (username.trim().length > 0 && (username.trim().length < 3 || username.trim().length > 30)) {
        errors.username = 'Username must be 3–30 characters.';
    }
    
    const hasEmail = !required(email);
    const hasMobile = !required(mobile);
    
    if (!hasEmail && !hasMobile) {
        errors.email = 'Enter an email address or mobile number.';
        errors.mobile = 'Enter an email address or mobile number.';
    }
    
    if (hasEmail && !/^\S+@\S+\.\S+$/.test(email.trim())) {
        errors.email = 'Enter a valid email address.';
    }
    if (hasMobile && !/^[0-9]{10,15}$/.test(mobile.trim())) {
        errors.mobile = 'Enter a valid mobile number (10-15 digits).';
    }
    
    if (password.length > 0 && (password.length < 6 || password.length > 128)) {
        errors.password = 'Password must be 6–128 characters.';
    }
    return errors;
};
