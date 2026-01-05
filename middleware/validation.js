// Validation middleware for common operations

const validateService = (req, res, next) => {
    const { serviceName, imageUrl, description, price, category } = req.body;

    const errors = [];

    if (!serviceName || serviceName.trim().length < 3) {
        errors.push('Service name must be at least 3 characters long');
    }

    if (!imageUrl || !isValidUrl(imageUrl)) {
        errors.push('Valid image URL is required');
    }

    if (!description || description.trim().length < 10) {
        errors.push('Description must be at least 10 characters long');
    }

    if (!price || isNaN(price) || price <= 0) {
        errors.push('Valid price is required');
    }

    if (!category || category.trim().length < 2) {
        errors.push('Category is required');
    }

    if (errors.length > 0) {
        return res.status(400).send({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const validateBooking = (req, res, next) => {
    const { serviceId, serviceName, customerEmail, Price, bookingDate } = req.body;

    const errors = [];

    if (!serviceId) {
        errors.push('Service ID is required');
    }

    if (!serviceName || serviceName.trim().length < 2) {
        errors.push('Service name is required');
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
        errors.push('Valid customer email is required');
    }

    if (!Price || isNaN(Price) || Price <= 0) {
        errors.push('Valid price is required');
    }

    if (!bookingDate) {
        errors.push('Booking date is required');
    }

    if (errors.length > 0) {
        return res.status(400).send({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const validateReview = (req, res, next) => {
    const { user, rating, comment } = req.body;

    const errors = [];

    if (!user || user.trim().length < 2) {
        errors.push('User name is required');
    }

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        errors.push('Rating must be between 1 and 5');
    }

    if (!comment || comment.trim().length < 5) {
        errors.push('Comment must be at least 5 characters long');
    }

    if (errors.length > 0) {
        return res.status(400).send({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

// Helper functions
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

module.exports = {
    validateService,
    validateBooking,
    validateReview
};