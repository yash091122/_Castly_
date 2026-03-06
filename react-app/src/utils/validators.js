// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Username validation
export const isValidUsername = (username) => {
    // Username must be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

// Password strength checker
export const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', message: 'Password must be at least 6 characters' };
    if (password.length < 8) return { strength: 'weak', message: 'Consider using a longer password' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength >= 4) return { strength: 'strong', message: 'Strong password' };
    if (strength >= 3) return { strength: 'medium', message: 'Good password' };
    return { strength: 'weak', message: 'Consider adding numbers or special characters' };
};

// Form validation
export const validateSignupForm = (formData) => {
    const errors = {};

    if (!formData.email) {
        errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
        errors.email = 'Invalid email address';
    }

    if (!formData.username) {
        errors.username = 'Username is required';
    } else if (!isValidUsername(formData.username)) {
        errors.username = 'Username must be 3-20 characters, alphanumeric and underscores only';
    }

    if (!formData.password) {
        errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
};

export const validateLoginForm = (formData) => {
    const errors = {};

    if (!formData.email) {
        errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
        errors.email = 'Invalid email address';
    }

    if (!formData.password) {
        errors.password = 'Password is required';
    }

    return errors;
};
