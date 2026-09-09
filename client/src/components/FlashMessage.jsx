import { useContext } from 'react';
import { FlashContext } from '../context/FlashContext';

const FlashMessage = () => {
    const { flash, clearFlash } = useContext(FlashContext);

    if (!flash) return null;

    return (
        <div className={`alert alert-${flash.type} alert-dismissible fade show`} role="alert">
            {flash.message}
            <button type="button" className="btn-close" aria-label="Close" onClick={clearFlash}></button>
        </div>
    );
};

export default FlashMessage;
