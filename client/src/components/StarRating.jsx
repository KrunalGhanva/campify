import { Fragment, useId } from 'react';

const StarRating = ({ rating, setRating, readOnly = false, name = 'rating' }) => {
    const idPrefix = useId().replace(/:/g, '');

    if (readOnly) {
        return (
            <span className="starability-result" data-rating={rating} aria-label={`${rating} out of 5 stars`}>
                Rated {rating} out of 5
            </span>
        );
    }

    return (
        <fieldset className="starability-basic">
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
                    />
                    <label htmlFor={`${idPrefix}-${num}`} title={`${num} stars`}>
                        {num} stars
                    </label>
                </Fragment>
            ))}
        </fieldset>
    );
};

export default StarRating;
