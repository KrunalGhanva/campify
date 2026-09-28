import { Fragment, useId, useState } from 'react';

const StarRating = ({ rating, setRating, readOnly = false, name = 'rating', size = 'md' }) => {
    const idPrefix = useId().replace(/:/g, '');
    const [hovered, setHovered] = useState(0);

    const sizeClass = size === 'lg' ? 'star-lg' : size === 'sm' ? 'star-sm' : '';

    if (readOnly) {
        return (
            <span className={`star-display ${sizeClass}`} aria-label={`${rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map(num => (
                    <span
                        key={num}
                        className={`star-icon ${num <= rating ? 'star-filled' : 'star-empty'}`}
                    >
                        ★
                    </span>
                ))}
            </span>
        );
    }

    return (
        <fieldset className={`star-picker ${sizeClass}`} style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="visually-hidden">Rating</legend>
            {[1, 2, 3, 4, 5].map((num) => (
                <Fragment key={num}>
                    <input
                        type="radio"
                        id={`${idPrefix}-${num}`}
                        name={name}
                        value={num}
                        checked={rating === num}
                        onChange={() => setRating(num)}
                        className="visually-hidden"
                    />
                    <label
                        htmlFor={`${idPrefix}-${num}`}
                        title={`${num} star${num > 1 ? 's' : ''}`}
                        className={`star-label ${num <= (hovered || rating) ? 'star-active' : ''}`}
                        onMouseEnter={() => setHovered(num)}
                        onMouseLeave={() => setHovered(0)}
                    >
                        ★
                    </label>
                </Fragment>
            ))}
        </fieldset>
    );
};

export default StarRating;
